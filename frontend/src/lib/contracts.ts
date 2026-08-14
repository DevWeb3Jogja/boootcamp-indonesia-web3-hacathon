// contracts.ts = alamat deployment + ABI. Sama persis dengan backend Sesi 5–6.

import { parseAbi } from "viem";

export const EXPLORER = "https://testnet.bscscan.com";

export const CONTRACTS = {
  rewardToken: "0xd3ec43f60e2ac1517c4dd80c0a23ad8d902eaf0f",
  bountyFactory: "0xfecc20bdaa28681bada577731b8a24f415cbca87",
} as const;

export const bountyFactoryAbi = parseAbi([
  "function totalBounties() view returns (uint256)",
  "function oracle() view returns (address)",
  "function createBounty(uint256 rewardAmount, string rulesURI, uint256 submissionDeadline) returns (address)",
  "event BountyCreated(uint256 indexed bountyId, address indexed escrow, address indexed creator, uint256 rewardAmount)",
]);

export const bountyEscrowAbi = parseAbi([
  "function status() view returns (uint8)",
  "function creator() view returns (address)",
  "function rewardAmount() view returns (uint256)",
  "function rulesURI() view returns (string)",
  "function worker() view returns (address)",
  "function proofURI() view returns (string)",
  "function submitWork(string proofURI)",
]);

export const rewardTokenAbi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

// Enum Status di BountyEscrow.sol — urutan harus sama persis
export const statusLabel = ["MenungguDana", "Dibuka", "Disubmit", "Selesai", "Dibatalkan"] as const;

export type Status = (typeof statusLabel)[number];
