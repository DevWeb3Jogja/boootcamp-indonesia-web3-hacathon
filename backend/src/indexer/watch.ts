// indexer/watch.ts = pantau event baru real-time (watchEvent)

import type { Address } from "viem";
import { CONTRACTS } from "../config";
import { bountyCreatedEvent, escrowEvents } from "../contracts";
import { client } from "../lib/chain";
import { knownEscrows } from "../lib/db";
import { handleBountyCreated, handleEscrowLog } from "./handlers";

export const watch = () => {
  const onError = (err: Error) => console.error("⚠️ watch error:", err.message);

  const watchEscrow = (address: Address) =>
    client.watchEvent({ address, events: escrowEvents, strict: true, onLogs: (logs) => logs.forEach(handleEscrowLog), onError });

  const escrows = knownEscrows();
  escrows.forEach(watchEscrow);

  // Escrow baru dari factory langsung ikut dipantau
  client.watchEvent({
    address: CONTRACTS.bountyFactory,
    event: bountyCreatedEvent,
    strict: true,
    onLogs: (logs) => logs.forEach((log) => { handleBountyCreated(log); watchEscrow(log.args.escrow); }),
    onError,
  });

  console.log("👀 watchEvent jalan: factory + %d escrow", escrows.length);
};
