// services/bounty.ts = business logic: baca state chain + gabungan data on/off chain

import type { Address } from "viem";
import { CONTRACTS } from "../config";
import { bountyEscrowAbi, bountyFactoryAbi, rewardTokenAbi, statusLabel } from "../contracts";
import { client } from "../lib/chain";
import { getBoard } from "../lib/db";

// readContract = membaca function view di kontrak (gratis, tanpa gas)

// Detail escrow live dari chain — 6 view dalam SATU request via multicall
export const readEscrow = async (escrow: Address) => {
  const contract = { address: escrow, abi: bountyEscrowAbi } as const;
  const [status, creator, rewardAmount, rulesURI, worker, proofURI] = await client.multicall({
    contracts: [
      { ...contract, functionName: "status" },
      { ...contract, functionName: "creator" },
      { ...contract, functionName: "rewardAmount" },
      { ...contract, functionName: "rulesURI" },
      { ...contract, functionName: "worker" },
      { ...contract, functionName: "proofURI" },
    ],
    allowFailure: false,
  });
  return { status: statusLabel[status], creator, rewardAmount: rewardAmount.toString(), rulesURI, worker, proofURI };
};

// Gabungan: total live dari chain + data historis hasil indexing
export const board = async () => ({
  total: Number(await client.readContract({
    address: CONTRACTS.bountyFactory, abi: bountyFactoryAbi, functionName: "totalBounties",
  })),
  ...getBoard(),
});

// Saldo RWD sebuah wallet
export const balanceOf = (addr: Address) =>
  client.readContract({ address: CONTRACTS.rewardToken, abi: rewardTokenAbi, functionName: "balanceOf", args: [addr] });