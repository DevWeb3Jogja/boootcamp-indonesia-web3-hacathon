// abis/BountyEscrowAbi.ts
export const BountyEscrowAbi = [
  {
    type: "event",
    name: "WorkSubmitted",
    inputs: [
      { name: "worker", type: "address", indexed: true, internalType: "address" },
      { name: "proofURI", type: "string", indexed: false, internalType: "string" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "RewardReleased",
    inputs: [
      { name: "worker", type: "address", indexed: true, internalType: "address" },
      { name: "rewardAmount", type: "uint256", indexed: false, internalType: "uint256" },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "WorkRejected",
    inputs: [
      { name: "worker", type: "address", indexed: true, internalType: "address" },
    ],
    anonymous: false,
  },
] as const;
