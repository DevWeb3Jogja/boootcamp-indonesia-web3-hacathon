"""Agent oracle Papan Sayembara.

Loop: baca registry BountyFactory -> cari escrow berstatus Disubmit ->
nilai proof vs rules pakai LLM -> kirim fulfillVerification(eligible) on-chain.
"""

import os
import time

from dotenv import load_dotenv

load_dotenv()

from abi import STATUS_DISUBMIT  # noqa: E402
from chain import (  # noqa: E402
    connect,
    load_escrow,
    load_factory,
    load_wallet,
    send_fulfill_verification,
)
from judge import judge_submission  # noqa: E402


def main():
    w3 = connect()
    factory = load_factory(w3)
    wallet = load_wallet()

    oracle_onchain = factory.functions.oracle().call()
    print(f"Agent wallet : {wallet.address}")
    print(f"Oracle on-chain: {oracle_onchain}")
    if oracle_onchain.lower() != wallet.address.lower():
        print("PERINGATAN: wallet agent BUKAN oracle di factory. Tx bakal revert BukanOracle.")

    interval = int(os.environ.get("POLL_INTERVAL_SECONDS", "15"))
    sudah_dinilai = set()  # (escrow, proofURI) yang sudah diproses

    print(f"Mulai polling tiap {interval} detik. Ctrl+C buat berhenti.")
    while True:
        try:
            total = factory.functions.totalBounties().call()
            for i in range(total):
                escrow_addr = factory.functions.bounties(i).call()
                escrow = load_escrow(w3, escrow_addr)
                if escrow.functions.status().call() != STATUS_DISUBMIT:
                    continue

                proof_uri = escrow.functions.proofURI().call()
                kunci = (escrow_addr, proof_uri)
                if kunci in sudah_dinilai:
                    continue

                rules_uri = escrow.functions.rulesURI().call()
                worker = escrow.functions.worker().call()
                print(f"\n[bounty #{i}] {escrow_addr}")
                print(f"  worker: {worker}")
                print(f"  proof : {proof_uri}")

                eligible, alasan = judge_submission(rules_uri, proof_uri, worker)
                print(f"  verdict AI: {'ELIGIBLE' if eligible else 'DITOLAK'} ({alasan})")

                tx_hash, sukses = send_fulfill_verification(w3, wallet, escrow, eligible)
                print(f"  tx: 0x{tx_hash} ({'sukses' if sukses else 'GAGAL'})")
                sudah_dinilai.add(kunci)
        except KeyboardInterrupt:
            print("\nBerhenti.")
            return
        except Exception as e:
            print(f"Error loop (lanjut lagi): {e}")
        time.sleep(interval)


if __name__ == "__main__":
    main()
