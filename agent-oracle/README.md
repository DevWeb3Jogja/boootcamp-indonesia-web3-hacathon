# Agent Oracle: AI verifier Papan Sayembara

AI agent yang jadi **oracle** buat BountyEscrow. Dibangun pakai [BNB Agent Studio](https://www.bnbchain.org/en/bnb-agent-studio): wallet agent dibuat dan dienkripsi lewat CLI `bag`, lalu agent ini yang tanda tangan + kirim transaksi `fulfillVerification` sendiri.

Alurnya: polling registry `BountyFactory` -> ketemu escrow berstatus `Disubmit` -> ambil `rulesURI` + `proofURI` -> minta LLM menilai -> kirim verdict on-chain.

Peserta bootcamp tinggal clone dan jalankan. Isi kodenya dibahas ringkas di Notion Pertemuan 4 Tab 4 (bukan materi utama sesi).

## Setup (sekali saja)

Prasyarat: **Python 3.10+** (`python3 --version`; Python bawaan macOS sering masih 3.9, kalau gitu `brew install python@3.12` dan pakai `python3.12 -m venv`).

```bash
cd agent-oracle
python3 -m venv .venv && source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

Buat wallet agent (keystore terenkripsi di `.studio/wallets/`):

```bash
export WALLET_PASSWORD="password_kuat_minimal_12_karakter"
bag wallet new
```

Alamat yang muncul = **alamat oracle**. Dua hal:

1. isi wallet-nya dikit tBNB dari faucet (buat gas kirim verdict), dan
2. daftarkan ke factory (rotasi dari oracle sementara): `cast send $BOUNTY_FACTORY "setOracle(address)" <ALAMAT_AGENT> --rpc-url $BSC_TESTNET_RPC --private-key $PRIVATE_KEY --legacy` dari folder `SmartContract` (setelah `source .env`).

Terakhir, salin `.env.example` jadi `.env` dan isi `BOUNTY_FACTORY`, `WALLET_PASSWORD`, dan API key LLM kamu.

## Jalankan

```bash
source .venv/bin/activate
python main.py
```

Output kalau ada submission masuk:

```
[bounty #0] 0xEscrow...
  worker: 0xB0B...
  proof : https://github.com/.../hasil.md
  verdict AI: ELIGIBLE (bukti sesuai aturan bounty)
  tx: 0xabc... (sukses)
```

## Struktur

| File | Isi |
| --- | --- |
| `main.py` | loop polling + orkestrasi |
| `chain.py` | koneksi RPC, wallet Studio, kirim tx verdict |
| `judge.py` | penilaian LLM (rules vs proof, output JSON eligible/alasan) |
| `abi.py` | ABI minimal factory + escrow |
| `studio.toml` | konfigurasi BNB Agent Studio (wallet evm-local, bsc-testnet) |

## Catatan keamanan

- Private key tidak pernah ada di kode atau `.env`. Keystore terenkripsi, dibuka pakai `WALLET_PASSWORD` di environment.
- Kontrak hanya menerima verdict dari alamat `factory.oracle()`. Ganti oracle = `setOracle` oleh owner factory.
- Kalau agent mati, creator tetap bisa resolve manual setelah `submissionDeadline` (fallback di kontrak).
