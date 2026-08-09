// index.ts = entry point: jalankan indexer, lalu sajikan API

import { PORT } from "./config";
import { backfill } from "./indexer/backfill";
import { watch } from "./indexer/watch";
import { app } from "./routes/api";

// Bila backfill gagal (RPC bermasalah), API tetap hidup — checkpoint melanjutkan di run berikutnya
await backfill().catch((e) => console.error("⚠️ backfill gagal, API tetap jalan:", e?.shortMessage ?? e));
watch();

console.log(`🚀 API jalan di http://localhost:${PORT}/board`);
export default { port: PORT, fetch: app.fetch };