// contracts.ts = alamat deployment workshop. ABI-nya kita tambahkan pas sesi.

export const EXPLORER = "https://testnet.bscscan.com";

export const CONTRACTS = {
  rewardToken: "0xe02314d2662427ce4e8497160e323fd279d3c263",
  bountyFactory: "0xaec3e0ff766d953b69c714c149af1d5b8b19f0c4",
} as const;

// Enum Status di BountyEscrow.sol — urutan harus sama persis
export const statusLabel = ["MenungguDana", "Dibuka", "Disubmit", "Selesai", "Dibatalkan"] as const;

export type Status = (typeof statusLabel)[number];
