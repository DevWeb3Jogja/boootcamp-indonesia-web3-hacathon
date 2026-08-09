import { parseAbiItem } from "abitype";
import { createConfig, factory } from "ponder";

import { BountyEscrowAbi } from "./abis/BountyEscrowAbi";
import { BountyFactoryAbi } from "./abis/BountyFactoryAbi";

// Event yang di-emit factory saat createBounty (parameter "escrow" = alamat child)
const bountyCreatedEvent = parseAbiItem(
  "event BountyCreated(uint256 indexed bountyId, address indexed escrow, address indexed creator, uint256 rewardAmount)",
);

// Deployment workshop (2 Agu 2026, verified) — salin dari SmartContract/broadcast/run-latest.json
const FACTORY = "0xfed3881ffb229453f53c20ba377d10b857b08247" as const;
const START_BLOCK = 122_685_851; // block deploy factory

export default createConfig({
  chains: {
    bscTestnet: {
      id: 97,
      // create-ponder convention: PONDER_RPC_URL_<chainId>
      rpc: process.env.PONDER_RPC_URL_97,
    },
  },
  contracts: {
    // Index factory sendiri (event BountyCreated)
    BountyFactory: {
      chain: "bscTestnet",
      abi: BountyFactoryAbi,
      address: FACTORY,
      startBlock: START_BLOCK,
    },
    // Index SEMUA escrow yang di-spawn factory (factory pattern)
    BountyEscrow: {
      chain: "bscTestnet",
      abi: BountyEscrowAbi,
      address: factory({
        address: FACTORY,
        event: bountyCreatedEvent,
        parameter: "escrow",
      }),
      startBlock: START_BLOCK,
    },
  },
});