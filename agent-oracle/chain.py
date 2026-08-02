"""Koneksi chain + wallet agent (keystore BNB Agent Studio) + kirim transaksi verdict."""

import os

from bnbagent_studio_core.wallet import get_wallet
from web3 import Web3

from abi import ESCROW_ABI, FACTORY_ABI

CHAIN_ID = 97  # BNB Smart Chain Testnet


def connect():
    rpc = os.environ.get("BSC_TESTNET_RPC", "https://bsc-testnet-rpc.publicnode.com")
    w3 = Web3(Web3.HTTPProvider(rpc))
    if not w3.is_connected():
        raise RuntimeError(f"Gagal konek ke RPC: {rpc}")
    return w3


def load_factory(w3):
    addr = os.environ["BOUNTY_FACTORY"]
    return w3.eth.contract(address=Web3.to_checksum_address(addr), abi=FACTORY_ABI)


def load_escrow(w3, addr):
    return w3.eth.contract(address=Web3.to_checksum_address(addr), abi=ESCROW_ABI)


def load_wallet():
    """Wallet agent dari keystore terenkripsi (.studio/wallets), dibuka pakai WALLET_PASSWORD."""
    wallet = get_wallet()
    return wallet


def send_fulfill_verification(w3, wallet, escrow, eligible):
    """Bangun, tanda tangan (via wallet Studio), dan broadcast tx fulfillVerification."""
    tx = escrow.functions.fulfillVerification(eligible).build_transaction(
        {
            "from": wallet.address,
            "nonce": w3.eth.get_transaction_count(wallet.address),
            "gasPrice": w3.eth.gas_price,
            "chainId": CHAIN_ID,
        }
    )
    signed = wallet.sign_transaction(tx)
    tx_hash = w3.eth.send_raw_transaction(signed["rawTransaction"])
    receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=180)
    return tx_hash.hex(), receipt.status == 1
