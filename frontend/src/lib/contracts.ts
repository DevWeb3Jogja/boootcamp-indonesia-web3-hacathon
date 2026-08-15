// contracts.ts = alamat deployment workshop. ABI-nya kita tambahkan pas sesi.

export const EXPLORER = "https://testnet.bscscan.com";

export const CONTRACTS = {
  rewardToken: "0xd3ec43f60e2ac1517c4dd80c0a23ad8d902eaf0f",
  bountyFactory: "0xfecc20bdaa28681bada577731b8a24f415cbca87",
} as const;

// Enum Status di BountyEscrow.sol — urutan harus sama persis
export const statusLabel = ["MenungguDana", "Dibuka", "Disubmit", "Selesai", "Dibatalkan"] as const;

export type Status = (typeof statusLabel)[number];
