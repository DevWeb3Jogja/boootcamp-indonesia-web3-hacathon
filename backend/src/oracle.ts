// oracle.ts = entry point ke-2: loop juri AI. Jalankan `bun oracle` di terminal terpisah.
// Satu project dengan API, tapi proses sendiri → bisa dimatikan tanpa mematikan API.

import { getAddress } from "viem";
import { POLL_INTERVAL_MS } from "./config";
import { getPending, insertVerdict } from "./lib/db";
import { oracleWallet } from "./lib/wallet";
import { readEscrow } from "./services/bounty";
import { judgeSubmission } from "./services/judge";
import { oracleOnchain, sendVerdict } from "./services/oracle";

if (!oracleWallet) throw new Error("ORACLE_PK belum diisi — cek .env");

const oracle = await oracleOnchain();
console.log(`Wallet juri    : ${oracleWallet.account.address}`);
console.log(`Oracle on-chain: ${oracle}`);
if (oracle.toLowerCase() !== oracleWallet.account.address.toLowerCase())
  console.log("PERINGATAN: wallet juri BUKAN oracle di factory. Tx bakal revert BukanOracle.");

const judged = new Set<string>(); // "escrow:proofURI" yang sudah diproses

console.log(`Juri AI jalan, polling tiap ${POLL_INTERVAL_MS / 1000} detik. Ctrl+C buat berhenti.`);
while (true) {
  try {
    // Antrean langsung dari SQLite yang sama dengan indexer — tanpa HTTP
    for (const item of getPending()) {
      const escrow = getAddress(item.escrow);
      const key = `${escrow}:${item.proof_uri}`;
      if (judged.has(key)) continue;

      // DB itu cache — sebelum kirim tx, cek kebenarannya di chain
      const e = await readEscrow(escrow);
      if (e.status !== "Disubmit") {
        judged.add(key); // indexer belum sinkron / sudah dinilai orang
        continue;
      }

      console.log(`\n[${escrow}]\n  worker: ${e.worker}\n  proof : ${e.proofURI}`);

      const { eligible, alasan } = await judgeSubmission(e.rulesURI, e.proofURI, e.worker);
      console.log(`  verdict AI: ${eligible ? "ELIGIBLE" : "DITOLAK"} (${alasan})`);

      const { hash, sukses } = await sendVerdict(escrow, eligible);
      console.log(`  tx: ${hash} (${sukses ? "sukses" : "GAGAL"})`);
      judged.add(key);

      // Alasan AI disimpan off-chain — chain cuma tahu true/false
      if (sukses) insertVerdict.run({
        escrow: escrow.toLowerCase(), worker: e.worker.toLowerCase(),
        eligible: eligible ? 1 : 0, alasan, txHash: hash, ts: Date.now(),
      });
    }
  } catch (e) {
    console.log(`Error loop (lanjut lagi): ${e}`);
  }
  await Bun.sleep(POLL_INTERVAL_MS);
}
