# Papan Sayembara - Sesi 4 (BountyFactory + AI Oracle)

Smart contract Sesi 4 DevWeb3 Jogja: factory bounty (`BountyFactory`) + escrow versi oracle (`BountyEscrow`) + token hadiah (`RewardToken`).
Materi lengkap ada di Notion "Pertemuan 4: Factory & AI Oracle".

## Kontrak
- `src/RewardToken.sol` - token hadiah ERC-20 (dibuat di Sesi 2)
- `src/BountyEscrow.sol` - escrow satu bounty, sekarang di-deploy oleh Factory: `confirmFunding`, `submitWork`, `fulfillVerification` (oracle), `approveWork`/`rejectWork` (fallback creator setelah deadline), `cancel`, plus `ReentrancyGuard`
- `src/BountyFactory.sol` - `Ownable`, nyimpen alamat `oracle` (`setOracle`), `createBounty` atomic (deploy + kunci hadiah dalam 1 tx) + registry `bounties`

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
Target: 48 test hijau, coverage 100% (BountyEscrow + BountyFactory + RewardToken).

## Deploy (BNB Smart Chain Testnet, chainId 97)

> Signer: script baca `PRIVATE_KEY` dari `.env`, jadi command gak perlu `--private-key`/`--account`. Isi `PRIVATE_KEY` di `.env` dulu.
>
> Penting: `--broadcast` itu WAJIB biar kontrak beneran ke-deploy. Tanpa `--rpc-url`/`--broadcast`, `forge script` cuma simulasi di EVM lokal.
1. Deploy token sekali (skip kalau udah punya dari Sesi 3), catat alamatnya ke `.env` sebagai `REWARD_TOKEN`:
```bash
source .env
forge script script/DeployRewardToken.s.sol:DeployRewardToken \
  --rpc-url bsc_testnet --broadcast --verify -vvvv --legacy
```
2. Isi `ORACLE_ADDRESS` di `.env` (boleh alamat wallet kamu dulu sebagai oracle sementara; nanti dirotasi ke wallet agent via `setOracle`, lihat `agent-oracle/README.md`), lalu deploy factory:
```bash
source .env
forge script script/DeployBountyFactory.s.sol:DeployBountyFactory \
  --rpc-url bsc_testnet --broadcast --verify -vvvv --legacy
```
3. Catat alamat factory ke `.env` sebagai `BOUNTY_FACTORY`, lalu bikin bounty pertama:
```bash
source .env
forge script script/CreateBounty.s.sol:CreateBounty \
  --rpc-url bsc_testnet --broadcast -vvvv --legacy
```
