// lib/chain.ts = viem public client, read-only (getLogs, readContract, watchEvent)

import { createPublicClient, fallback, http } from "viem";
import { bscTestnet } from "viem/chains";
import { RPC_URLS } from "../config";

// rank: transport diurutkan berdasarkan kesehatan, yang bermasalah tidak selalu dicoba pertama
export const transport = fallback(RPC_URLS.map((url) => http(url)), { rank: true });

export const client = createPublicClient({
  chain: bscTestnet, // chainId 97, sudah tersedia di viem/chains
  transport,
});
