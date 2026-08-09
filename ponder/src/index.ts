import { ponder } from "ponder:registry";
import { bounty, submission } from "ponder:schema";

// Factory: BountyCreated → row bounty
ponder.on("BountyFactory:BountyCreated", async ({ event, context }) => {
  const { bountyId, escrow, creator, rewardAmount } = event.args;

  await context.db
    .insert(bounty)
    .values({
      id: escrow,
      bountyId: Number(bountyId),
      creator,
      rewardAmount,
      createdAtBlock: event.block.number,
      createdAt: event.block.timestamp,
    })
    .onConflictDoNothing();

  console.log(`📦 bounty #${bountyId} by ${creator} → ${escrow}`);
});

// Escrow: WorkSubmitted
ponder.on("BountyEscrow:WorkSubmitted", async ({ event, context }) => {
  const escrow = event.log.address;
  const { worker, proofURI } = event.args;

  await context.db
    .insert(submission)
    .values({
      id: `${escrow}-${worker}`,
      bountyEscrow: escrow,
      worker,
      proofUri: proofURI,
      status: "submitted",
      blockNumber: event.block.number,
      submittedAt: event.block.timestamp,
    })
    .onConflictDoUpdate({
      proofUri: proofURI,
      status: "submitted",
      blockNumber: event.block.number,
      submittedAt: event.block.timestamp,
    });

  console.log(`📝 submit ${worker} @ ${escrow}`);
});

// Escrow: RewardReleased
ponder.on("BountyEscrow:RewardReleased", async ({ event, context }) => {
  const escrow = event.log.address;
  const { worker, rewardAmount } = event.args;

  await context.db
    .update(submission, { id: `${escrow}-${worker}` })
    .set({ status: "rewarded", rewardAmount });

  console.log(`✅ reward ${worker} @ ${escrow}`);
});

// Escrow: WorkRejected
ponder.on("BountyEscrow:WorkRejected", async ({ event, context }) => {
  const escrow = event.log.address;
  const { worker } = event.args;

  await context.db
    .update(submission, { id: `${escrow}-${worker}` })
    .set({ status: "rejected" });

  console.log(`❌ reject ${worker} @ ${escrow}`);
});