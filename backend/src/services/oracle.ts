// services/oracle.ts = peran JURI: kirim verdict on-chain (wallet terpisah dari relayer)

import type { Address } from "viem";
import { CONTRACTS } from "../config";
import { bountyEscrowAbi, bountyFactoryAbi } from "../contracts";
import { client } from "../lib/chain";
import { oracleWallet } from "../lib/wallet";

// Alamat oracle yang diakui kontrak — verdict dari alamat lain pasti revert BukanOracle
export const oracleOnchain = () =>
  client.readContract({ address: CONTRACTS.bountyFactory, abi: bountyFactoryAbi, functionName: "oracle" });

// gasPrice eksplisit = transaksi legacy (BSC testnet menolak EIP-1559)
export const sendVerdict = async (escrow: Address, eligible: boolean) => {
  if (!oracleWallet) throw new Error("ORACLE_PK belum diisi");
  const hash = await oracleWallet.writeContract({
    address: escrow, abi: bountyEscrowAbi, functionName: "fulfillVerification",
    args: [eligible], gasPrice: await client.getGasPrice(),
  });
  const receipt = await client.waitForTransactionReceipt({ hash });
  return { hash, sukses: receipt.status === "success" };
};
