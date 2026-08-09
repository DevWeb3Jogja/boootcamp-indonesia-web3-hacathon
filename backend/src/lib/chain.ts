// lib/chain.ts = viem public client, read-only (getLogs, readContract, watchEvent)

import { createPublicClient, fallback, http } from "viem";
import { bscTestnet } from "viem/chains";
import { RPC_URLS } from "../config";

export const client = createPublicClient({
  chain: bscTestnet,
  transport: fallback(RPC_URLS.map((url) => http(url)), { rank: true }),
});
