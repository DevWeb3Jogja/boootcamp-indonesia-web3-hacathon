// lib/db.ts = SQLite (bun:sqlite): skema, prepared statement, dan query
// 3 tabel: bounties, submissions, sync_checkpoint (block terakhir yang diproses)

import { Database } from "bun:sqlite";
import type { Address } from "viem";

// strict: bind {param} tanpa prefix "@" + error bila ada parameter terlewat
export const db = new Database("papan-sayembara.db", { create: true, strict: true });

// WAL = baca & tulis barengan; busy_timeout = sabar antre kalau proses lain lagi nulis
// (dua proses pakai file ini: `bun dev` untuk indexer/API dan `bun oracle` untuk juri)
db.exec("PRAGMA journal_mode = WAL; PRAGMA busy_timeout = 5000;");

db.exec(`
  CREATE TABLE IF NOT EXISTS bounties (
    bounty_id    INTEGER PRIMARY KEY,
    escrow       TEXT UNIQUE NOT NULL,
    creator      TEXT NOT NULL,
    reward_amount TEXT NOT NULL,
    tx_hash      TEXT NOT NULL,
    block_number INTEGER NOT NULL,
    created_at   INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS submissions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    escrow        TEXT NOT NULL,
    worker        TEXT NOT NULL,
    proof_uri     TEXT NOT NULL,
    status        TEXT NOT NULL, -- 'submitted' | 'rewarded' | 'rejected'
    reward_amount TEXT,
    tx_hash       TEXT UNIQUE NOT NULL, -- UNIQUE → tidak ada baris ganda
    block_number  INTEGER NOT NULL,
    created_at    INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_submissions_escrow ON submissions(escrow);
  CREATE INDEX IF NOT EXISTS idx_submissions_worker ON submissions(worker);

  CREATE TABLE IF NOT EXISTS sync_checkpoint (
    id          INTEGER PRIMARY KEY CHECK (id = 1),
    last_block  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS verdicts (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    escrow     TEXT NOT NULL,
    worker     TEXT NOT NULL,
    eligible   INTEGER NOT NULL, -- 0/1; chain cuma simpan hasilnya, alasan AI hidup di sini
    alasan     TEXT NOT NULL,
    tx_hash    TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_verdicts_escrow ON verdicts(escrow);
`);

// Bentuk baris tabel (dipakai di services/routes)
export type BountyRow = {
  bounty_id: number; escrow: string; creator: string; reward_amount: string;
  tx_hash: string; block_number: number; created_at: number;
};
export type SubmissionRow = {
  id: number; escrow: string; worker: string; proof_uri: string; status: string;
  reward_amount: string | null; tx_hash: string; block_number: number; created_at: number;
};

// Block terakhir yang sudah diproses (untuk backfill)
export const getCheckpoint = (): bigint => {
  const row = db.prepare("SELECT last_block FROM sync_checkpoint WHERE id = 1").get() as { last_block: number } | undefined;
  return BigInt(row?.last_block ?? 0);
};

export const setCheckpoint = (block: bigint) =>
  db.prepare("INSERT INTO sync_checkpoint (id, last_block) VALUES (1, ?1) ON CONFLICT(id) DO UPDATE SET last_block = ?1")
    .run(Number(block));

// Daftar alamat escrow yang sudah dikenal indexer
export const knownEscrows = () =>
  (db.prepare("SELECT escrow FROM bounties").all() as { escrow: string }[]).map((r) => r.escrow as Address);

// Insert bounty (ON CONFLICT DO NOTHING = idempotent)
export const upsertBounty = db.prepare(`
  INSERT INTO bounties (bounty_id, escrow, creator, reward_amount, tx_hash, block_number, created_at)
  VALUES (@bountyId, @escrow, @creator, @rewardAmount, @txHash, @blockNumber, @ts)
  ON CONFLICT(bounty_id) DO NOTHING
`);

// Insert submission (OR IGNORE + tx_hash UNIQUE = idempotent)
export const insertSubmission = db.prepare(`
  INSERT OR IGNORE INTO submissions (escrow, worker, proof_uri, status, tx_hash, block_number, created_at)
  VALUES (@escrow, @worker, @proofUri, 'submitted', @txHash, @blockNumber, @ts)
`);

// Update status submission terakhir pada escrow tertentu (tanpa match = no-op)
export const markLatestSubmission = (escrow: string, status: string, rewardAmount?: string) =>
  db.prepare(`
    UPDATE submissions SET status = ?, reward_amount = ?
    WHERE id = (SELECT id FROM submissions WHERE escrow = ? ORDER BY id DESC LIMIT 1)
  `).run(status, rewardAmount ?? null, escrow);

// Query untuk API: daftar bounty + submission hasil indexing
export const getBoard = () => ({
  bounties: db.prepare("SELECT * FROM bounties ORDER BY block_number DESC").all() as BountyRow[],
  submissions: db.prepare("SELECT * FROM submissions ORDER BY block_number DESC").all() as SubmissionRow[],
});

// Submission yang masih menunggu penilaian (dipakai agent-oracle via GET /pending)
export type PendingRow = Pick<SubmissionRow, "escrow" | "worker" | "proof_uri" | "block_number" | "created_at">;

export const getPending = () =>
  db.prepare(`
    SELECT escrow, worker, proof_uri, block_number, created_at FROM submissions
    WHERE status = 'submitted' ORDER BY block_number ASC
  `).all() as PendingRow[];

// Peringkat worker: jumlah menang + total reward (BigInt di JS — wei kelewat besar buat SUM SQLite)
export const getLeaderboard = () => {
  const rows = db.prepare("SELECT worker, reward_amount FROM submissions WHERE status = 'rewarded'")
    .all() as { worker: string; reward_amount: string | null }[];
  const skor = new Map<string, { wins: number; total: bigint }>();
  for (const r of rows) {
    const s = skor.get(r.worker) ?? { wins: 0, total: 0n };
    skor.set(r.worker, { wins: s.wins + 1, total: s.total + BigInt(r.reward_amount ?? 0) });
  }
  return [...skor]
    .map(([worker, s]) => ({ worker, wins: s.wins, total_reward: s.total.toString() }))
    .sort((a, b) => b.wins - a.wins);
};

// Verdict AI: hasil + alasan (chain cuma tahu true/false — alasannya disimpan off-chain)
export const insertVerdict = db.prepare(`
  INSERT INTO verdicts (escrow, worker, eligible, alasan, tx_hash, created_at)
  VALUES (@escrow, @worker, @eligible, @alasan, @txHash, @ts)
`);

export const getVerdicts = (escrow: string) =>
  db.prepare("SELECT * FROM verdicts WHERE escrow = ? ORDER BY id DESC").all(escrow);
