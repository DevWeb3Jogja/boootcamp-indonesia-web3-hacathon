// indexer/handlers.ts = ambil log dari chain + terjemahkan jadi baris database

import type { Address } from "viem";
import { CONTRACTS } from "../config";
import { bountyCreatedEvent, escrowEvents } from "../contracts";
import { client } from "../lib/chain";
import { insertSubmission, markLatestSubmission, upsertBounty } from "../lib/db";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Kadang semua RPC error bersamaan sesaat → ulangi dari awal daftar fallback
const withRetry = async <T>(fn: () => Promise<T>, tries = 5): Promise<T> => {
  for (let i = 1; ; i++) {
    try { return await fn(); } catch (e) { if (i >= tries) throw e; await sleep(1500 * i); }
  }
};

const now = () => Math.floor(Date.now() / 1000);

export const getFactoryLogs = (fromBlock: bigint, toBlock: bigint) =>
  withRetry(() => client.getLogs({ address: CONTRACTS.bountyFactory, event: bountyCreatedEvent, fromBlock, toBlock, strict: true }));

// Satu request untuk banyak alamat + banyak event sekaligus
export const getEscrowLogs = (address: Address[], fromBlock: bigint, toBlock: bigint) =>
  withRetry(() => client.getLogs({ address, events: escrowEvents, fromBlock, toBlock, strict: true }));

export const handleBountyCreated = (log: Awaited<ReturnType<typeof getFactoryLogs>>[number]) => {
  upsertBounty.run({
    bountyId: Number(log.args.bountyId),
    escrow: log.args.escrow,
    creator: log.args.creator,
    rewardAmount: log.args.rewardAmount.toString(),
    txHash: log.transactionHash,
    blockNumber: Number(log.blockNumber),
    ts: now(),
  });
  console.log("📦 bounty created  #%s by %s", log.args.bountyId, log.args.creator);
};

export const handleEscrowLog = (log: Awaited<ReturnType<typeof getEscrowLogs>>[number]) => {
  const escrow = log.address; // alamat escrow yang meng-emit event
  switch (log.eventName) {
    case "WorkSubmitted":
      insertSubmission.run({
        escrow,
        worker: log.args.worker,
        proofUri: log.args.proofURI,
        txHash: log.transactionHash,
        blockNumber: Number(log.blockNumber),
        ts: now(),
      });
      console.log("📝 work submitted  %s → %s", log.args.worker, escrow);
      break;
    case "RewardReleased":
      markLatestSubmission(escrow, "rewarded", log.args.rewardAmount.toString());
      console.log("✅ reward released %s wei → %s", log.args.rewardAmount, escrow);
      break;
    case "WorkRejected":
      markLatestSubmission(escrow, "rejected");
      console.log("❌ work rejected   %s", escrow);
      break;
  }
};