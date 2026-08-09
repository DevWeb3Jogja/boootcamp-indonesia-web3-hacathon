// config.ts = satu tempat untuk semua konfigurasi & konstanta

// RPC publik bisa mati kapan saja → daftar fallback, .env dicoba pertama
export const RPC_URLS = [
  process.env.RPC_URL,
  "https://bnb-testnet.api.onfinality.io/public",
  "https://bsc-testnet-rpc.publicnode.com",
  "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
].filter(Boolean) as string[];

// Alamat deployment workshop — salin dari broadcast/run-latest.json, jangan ketik manual
export const CONTRACTS = {
  rewardToken: "0xd3ec43f60e2ac1517c4dd80c0a23ad8d902eaf0f",
  bountyFactory: "0xfecc20bdaa28681bada577731b8a24f415cbca87",
} as const;

export const DEPLOY_BLOCK = 124_034_703n; // block deploy factory, titik awal scan
export const CHUNK = 9000n; // drpc gratis: maks 10k block per getLogs
export const PORT = Number(process.env.PORT ?? 3000);