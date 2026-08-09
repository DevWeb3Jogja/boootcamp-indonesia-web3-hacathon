// contracts.ts = semua definisi kontrak: ABI, event, label status
// view = dibaca gratis; sisanya dipanggil endpoint tulis lewat wallet relayer

import { parseAbi, parseAbiItem } from "viem";

export const bountyFactoryAbi = parseAbi([
  "function totalBounties() view returns (uint256)",
  "function oracle() view returns (address)",
  "function createBounty(uint256 rewardAmount, string rulesURI, uint256 submissionDeadline) returns (address)",
]);

export const bountyEscrowAbi = parseAbi([
  "function status() view returns (uint8)",
  "function creator() view returns (address)",
  "function rewardAmount() view returns (uint256)",
  "function rulesURI() view returns (string)",
  "function worker() view returns (address)",
  "function proofURI() view returns (string)",
  "function submitWork(string proofURI)",
  "function fulfillVerification(bool eligible)",
]);

export const rewardTokenAbi = parseAbi([
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);

// Event yang di-track (untuk getLogs / watchEvent)
export const bountyCreatedEvent = parseAbiItem(
  "event BountyCreated(uint256 indexed bountyId, address indexed escrow, address indexed creator, uint256 rewardAmount)"
);

// Tiga event escrow digabung — getLogs/watchEvent menerima banyak event + alamat sekaligus
export const escrowEvents = [
  parseAbiItem("event WorkSubmitted(address indexed worker, string proofURI)"),
  parseAbiItem("event RewardReleased(address indexed worker, uint256 rewardAmount)"),
  parseAbiItem("event WorkRejected(address indexed worker)"),
] as const;

// Enum Status di BountyEscrow.sol — urutan harus sama persis
export const statusLabel = ["MenungguDana", "Dibuka", "Disubmit", "Selesai", "Dibatalkan"] as const;
