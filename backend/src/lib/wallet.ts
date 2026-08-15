// lib/wallet.ts = dua wallet yang bisa TANDA TANGAN transaksi; sisa backend read-only

import { createWalletClient } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { ORACLE_PK, RELAYER_PK } from "../config";
import { transport } from "./chain";

const walletFrom = (pk?: `0x${string}`) =>
  pk ? createWalletClient({ account: privateKeyToAccount(pk), chain: bscTestnet, transport }) : null;

// null = private key belum diisi → fitur terkait mati, sisanya tetap hidup
export const relayerWallet = walletFrom(RELAYER_PK); // panitia: createBounty + submitWork
export const oracleWallet = walletFrom(ORACLE_PK); // juri: fulfillVerification
