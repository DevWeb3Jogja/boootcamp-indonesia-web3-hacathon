# Papan Sayembara - Sesi 3 (BountyEscrow)

Smart contract Sesi 3 DevWeb3 Jogja: escrow bounty (`BountyEscrow`) + token hadiah (`RewardToken`).
Materi lengkap ada di Notion "Pertemuan 3: Papan Sayembara (Bounty)".

## Kontrak
- `src/RewardToken.sol` - token hadiah ERC-20 (dibuat di Sesi 2)
- `src/BountyEscrow.sol` - escrow satu bounty: `fund`, `submitWork`, `approveWork`, `rejectWork`, `cancel` (escrow asli/lock, custom error, SafeERC20, checks-effects-interactions)

## Setup (setelah clone)
`lib/` (OpenZeppelin + forge-std) sengaja gak di-commit ke repo. Install dulu:
```bash
forge install OpenZeppelin/openzeppelin-contracts foundry-rs/forge-std
```
Lalu salin `.env.example` jadi `.env` dan isi nilainya.

## Test + coverage
```bash
forge test
forge coverage --no-match-coverage "script/"
```
Target: 30 test hijau, coverage 100% (BountyEscrow + RewardToken).

## Deploy (BNB Smart Chain Testnet, chainId 97)

> Signer: script baca `PRIVATE_KEY` dari `.env`, jadi command gak perlu `--private-key`/`--account`. Isi `PRIVATE_KEY` di `.env` dulu.
>
> Penting: `--broadcast` itu WAJIB biar kontrak beneran ke-deploy. Tanpa `--rpc-url`/`--broadcast`, `forge script` cuma simulasi di EVM lokal (gak ke-deploy ke mana-mana), dan deploy escrow bakal gagal karena token-nya gak beneran ada. Buat cek logika di lokal, pakai `forge test`.
1. Deploy token sekali, catat alamatnya ke `.env` sebagai `REWARD_TOKEN`:
```bash
source .env
forge script script/DeployRewardToken.s.sol:DeployRewardToken \
  --rpc-url bsc_testnet --broadcast --verify -vvvv --legacy
```
2. Deploy escrow (baca `REWARD_TOKEN` dari `.env`):
```bash
source .env
forge script script/DeployBountyEscrow.s.sol:DeployBountyEscrow \
  --rpc-url bsc_testnet --broadcast --verify -vvvv --legacy
```
