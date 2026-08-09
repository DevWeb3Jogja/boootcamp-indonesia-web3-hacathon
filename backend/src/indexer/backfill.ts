// indexer/backfill.ts = scan riwayat event per chunk, checkpoint tiap chunk

import { CHUNK, DEPLOY_BLOCK } from "../config";
import { client } from "../lib/chain";
import { db, getCheckpoint, knownEscrows, setCheckpoint } from "../lib/db";
import { getEscrowLogs, getFactoryLogs, handleBountyCreated, handleEscrowLog, sleep } from "./handlers";

export const backfill = async () => {
  const checkpoint = getCheckpoint();
  let from = checkpoint > DEPLOY_BLOCK ? checkpoint + 1n : DEPLOY_BLOCK;
  const latest = await client.getBlockNumber();
  if (from > latest) return;

  console.log("🔄 backfill dari block %s → %s", from, latest);

  while (from <= latest) {
    const to = from + CHUNK - 1n > latest ? latest : from + CHUNK - 1n;
    // Factory dahulu, baru escrow — escrow yang lahir di chunk ini langsung ikut di-scan
    (await getFactoryLogs(from, to)).forEach(handleBountyCreated);
    const escrows = knownEscrows();
    if (escrows.length) (await getEscrowLogs(escrows, from, to)).forEach(handleEscrowLog);
    setCheckpoint(to); // mati di tengah? lanjut dari sini
    from = to + 1n;
    await sleep(50); // jaga jatah rate limit RPC gratis
  }

  const count = (t: string) => (db.prepare(`SELECT COUNT(*) c FROM ${t}`).get() as { c: number }).c;
  console.log("✅ backfill selesai | bounties: %d | submissions: %d", count("bounties"), count("submissions"));
};