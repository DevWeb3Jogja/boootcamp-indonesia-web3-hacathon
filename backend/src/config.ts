// config.ts = satu tempat untuk semua konfigurasi & konstanta

// RPC publik bisa mati kapan saja → daftar fallback, .env dicoba pertama
export const RPC_URLS = [
  process.env.RPC_URL,
].filter(Boolean) as string[];

// Alamat deployment workshop — salin dari broadcast/run-latest.json, jangan ketik manual
export const CONTRACTS = {
  rewardToken: "0xa94218dbdb142a10e32ef7b494105d27f47f7045",
  bountyFactory: "0xfed3881ffb229453f53c20ba377d10b857b08247",
} as const;

export const DEPLOY_BLOCK = 122_685_851n; // block deploy factory, titik awal scan
export const CHUNK = 999n; // muat di semua RPC gratis (thirdweb: maks 1000 block per getLogs)
export const PORT = Number(process.env.PORT ?? 3000);