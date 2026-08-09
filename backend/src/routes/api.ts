// routes/api.ts = definisi endpoint REST (Hono)

import { Hono } from "hono";
import { cors } from "hono/cors";
import { isAddress } from "viem";
import { getBoard, getLeaderboard, getPending, getVerdicts, insertVerdict } from "../lib/db";
import { relayerWallet } from "../lib/wallet";
import { balanceOf, board, readEscrow } from "../services/bounty";
import { createBounty, relayerAddress, submitWork } from "../services/relayer";

export const app = new Hono();

app.use("/*", cors()); // izinkan frontend localhost memanggil API

app.onError((err, c) => {
  console.error("api error:", err);
  return c.json({ error: "internal error" }, 500);
});
app.notFound((c) => c.json({ error: "route tidak ditemukan" }, 404));

// GET /board → semua bounty + submission (hasil indexing + total live)
app.get("/board", async (c) => c.json(await board()));

// GET /bounty/:escrow → detail satu bounty (live dari chain)
app.get("/bounty/:escrow", async (c) => {
  const escrow = c.req.param("escrow");
  if (!isAddress(escrow)) return c.json({ error: "alamat tidak valid" }, 400);
  return c.json(await readEscrow(escrow));
});

// GET /wallet/:address → bounty yang dibuat + submission milik wallet tersebut
app.get("/wallet/:address", (c) => {
  const addr = c.req.param("address").toLowerCase();
  if (!isAddress(addr)) return c.json({ error: "alamat tidak valid" }, 400);
  const { bounties, submissions } = getBoard();
  return c.json({
    bounties: bounties.filter((b) => b.creator.toLowerCase() === addr),
    submissions: submissions.filter((s) => s.worker.toLowerCase() === addr),
  });
});

// GET /balance/:address → saldo token RWD
app.get("/balance/:address", async (c) => {
  const addr = c.req.param("address");
  if (!isAddress(addr)) return c.json({ error: "alamat tidak valid" }, 400);
  return c.json({ balance: (await balanceOf(addr)).toString() });
});

// GET /pending → submission yang menunggu penilaian (dikonsumsi agent-oracle)
app.get("/pending", (c) => c.json({ pending: getPending() }));

// GET /leaderboard → peringkat worker berdasarkan jumlah reward yang diterima
app.get("/leaderboard", (c) => c.json({ leaderboard: getLeaderboard() }));

// POST /verdicts → agent-oracle lapor hasil + alasan AI (chain cuma simpan true/false)
app.post("/verdicts", async (c) => {
  const b = await c.req.json().catch(() => null);
  const valid = b && isAddress(b.escrow) && isAddress(b.worker)
    && typeof b.eligible === "boolean" && typeof b.alasan === "string";
  if (!valid) return c.json({ error: "butuh: escrow, worker, eligible (boolean), alasan" }, 400);
  // lowercase biar konsisten dengan tabel submissions (alamat dari body bisa checksummed)
  insertVerdict.run({
    escrow: b.escrow.toLowerCase(), worker: b.worker.toLowerCase(), eligible: b.eligible ? 1 : 0,
    alasan: b.alasan, txHash: b.tx_hash ?? null, ts: Date.now(),
  });
  return c.json({ ok: true }, 201);
});

// GET /verdicts/:escrow → riwayat penilaian AI untuk satu bounty (beserta alasannya)
app.get("/verdicts/:escrow", (c) => {
  const escrow = c.req.param("escrow");
  if (!isAddress(escrow)) return c.json({ error: "alamat tidak valid" }, 400);
  return c.json({ verdicts: getVerdicts(escrow.toLowerCase()) });
});

// --- Endpoint TULIS: backend yang tanda tangan & bayar gas (relayer) ---

// Semua route di bawah butuh RELAYER_PK; tanpa itu backend cuma bisa baca
app.use("/relay/*", async (c, next) => {
  if (!relayerWallet) return c.json({ error: "relayer mati: isi RELAYER_PK di .env" }, 503);
  await next();
});

// POST /relay/bounty → bikin bounty baru (approve + createBounty dalam satu panggilan)
app.post("/relay/bounty", async (c) => {
  const b = await c.req.json().catch(() => null);
  if (!b || typeof b.reward !== "string" || typeof b.rules_uri !== "string")
    return c.json({ error: "butuh: reward (string, mis. \"10\"), rules_uri" }, 400);
  return c.json(await createBounty(b.reward, b.rules_uri, Number(b.deadline_jam ?? 24)), 201);
});

// POST /relay/bounty/:escrow/submit → kirim bukti kerjaan ke satu bounty
app.post("/relay/bounty/:escrow/submit", async (c) => {
  const escrow = c.req.param("escrow");
  const b = await c.req.json().catch(() => null);
  if (!isAddress(escrow)) return c.json({ error: "alamat tidak valid" }, 400);
  if (!b || typeof b.proof_uri !== "string") return c.json({ error: "butuh: proof_uri" }, 400);
  return c.json(await submitWork(escrow, b.proof_uri));
});

// GET /health → cek server hidup + status relayer
app.get("/health", (c) =>
  c.json({ ok: true, relayer: relayerAddress() ?? "mati", time: new Date().toISOString() }));
