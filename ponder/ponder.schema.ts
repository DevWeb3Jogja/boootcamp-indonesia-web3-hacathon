import { onchainTable } from "ponder";

// Siapa posting tugas apa
export const bounty = onchainTable("bounty", (t) => ({
  id: t.text().primaryKey(), // alamat escrow
  bountyId: t.integer().notNull(),
  creator: t.hex().notNull(),
  rewardAmount: t.bigint().notNull(),
  createdAtBlock: t.bigint().notNull(),
  createdAt: t.bigint().notNull(),
}));

// Siapa submit / klaim apa
export const submission = onchainTable("submission", (t) => ({
  id: t.text().primaryKey(), // `${escrow}-${worker}`
  bountyEscrow: t.hex().notNull(),
  worker: t.hex().notNull(),
  proofUri: t.text().notNull(),
  status: t.text().notNull(), // submitted | rewarded | rejected
  rewardAmount: t.bigint(),
  blockNumber: t.bigint().notNull(),
  submittedAt: t.bigint().notNull(),
}));