// config.ts = satu tempat untuk semua konfigurasi & konstanta

// RPC publik bisa mati kapan saja → daftar fallback, .env dicoba pertama.
// thirdweb sengaja TIDAK dipakai: getLogs-nya balikin [] kosong tanpa error (data hilang diam-diam).
export const RPC_URLS = [
  process.env.RPC_URL,
  "https://bnb-testnet.api.onfinality.io/public",
  "https://bsc-testnet-rpc.publicnode.com",
  "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
].filter(Boolean) as string[];

// Alamat deployment workshop — salin dari broadcast/run-latest.json, jangan ketik manual
export const CONTRACTS = {
  rewardToken: "0xe02314d2662427ce4e8497160e323fd279d3c263",
  bountyFactory: "0xaec3e0ff766d953b69c714c149af1d5b8b19f0c4",
} as const;

// Dua wallet, dua peran. Kosong = fitur terkait mati, sisanya tetap jalan.
export const RELAYER_PK = process.env.RELAYER_PK as `0x${string}` | undefined; // panitia: bikin bounty (/relay/*)
export const ORACLE_PK = process.env.ORACLE_PK as `0x${string}` | undefined; // juri: kirim verdict (bun oracle)

// LLM juri: endpoint OpenAI-compatible (OpenRouter / OpenAI / dll)
export const LLM = {
  baseUrl: (process.env.LLM_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, ""),
  apiKey: process.env.LLM_API_KEY,
  model: process.env.LLM_MODEL ?? "gpt-4o-mini",
} as const;

export const DEPLOY_BLOCK = 125_435_962n; // block deploy factory, titik awal scan
export const CHUNK = 9000n; // drpc gratis: maks 10k block per getLogs
export const PORT = Number(process.env.PORT ?? 3000);
export const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_SECONDS ?? 15) * 1000;
