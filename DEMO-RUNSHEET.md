# Runsheet Demo Sesi 4 (pegangan instruktur)

Kondisi awal: codebase = fresh minggu 3 (sudah di-reset). `agent-oracle/` sudah siap total: wallet oracle `0x842013c675fd7318464d06D243cc494fbFD6ba17`, `.env` terisi Gemini. Kode lengkap buat copas ada di Notion Pertemuan 4 (Tab 1 = smart contract, Tab 2 = oracle).

## Sebelum mulai (checklist H-1)

- [ ] Kirim tBNB dari faucet ke wallet agent: `0x842013c675fd7318464d06D243cc494fbFD6ba17` (buat gas verdict)
- [ ] Wallet dev kamu ada tBNB (deploy + createBounty + setOracle)
- [ ] Python 3.10+ jalan: `cd agent-oracle && source .venv/bin/activate && python --version` (kalau venv masih 3.9: `rm -rf .venv && python3.12 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt`)
- [ ] Smoke test agent: `python main.py` (harus muncul "Agent wallet: 0x8420...", Ctrl+C)
- [ ] Siapin 1 file rules + 1 file proof di gist/GitHub (bahan demo submitWork)

## Segmen A: Smart contract (live-code, copas dari Notion Tab 1)

1. `forge test` dulu → 20 hijau (baseline minggu 3).
2. Rapikan test: `mv test/RewardToken.t.sol test/BountyEscrow.t.sol`, lalu bikin `test/RewardToken.t.sol` (copas dari Notion Sesi 2 Tab 3).
3. Edit `src/BountyEscrow.sol` bagian FACTORY (copas dari Tab 1 Langkah 2): interface + `factory` + `hanyaFactory` + error, constructor baru, `fund` jadi `confirmFunding`. Checkpoint `forge build`.
4. Edit `src/BountyEscrow.sol` bagian ORACLE (copas dari Tab 1 Langkah 3): ReentrancyGuard, event, error, `hanyaOracle`, `fulfillVerification`, fallback `approveWork`/`rejectWork`, `cancel` nonReentrant, 2 fungsi internal. Checkpoint `forge build`. (Konsepnya jangan dibedah dulu, bilang "ini dibahas habis deploy".)
5. Bikin `src/BountyFactory.sol` (copas dari Tab 1 Langkah 5). Checkpoint `forge build`.
6. Timpa `test/BountyEscrow.t.sol` + bikin `test/BountyFactory.t.sol` (copas dari Tab 1 Langkah 6). Jalankan:
   - `forge test` → 48 hijau
   - `forge coverage --no-match-coverage "script/"` → 100% x3 kontrak
7. Deploy (copas dari Tab 1 Langkah 7):
   - `rm script/DeployBountyEscrow.s.sol`
   - Bikin `script/DeployBountyFactory.s.sol` + `script/CreateBounty.s.sol`
   - `.env`: tambah `ORACLE_ADDRESS=<alamat wallet kamu>` (oracle sementara!) 
   - `source .env && forge script script/DeployBountyFactory.s.sol:DeployBountyFactory --rpc-url bsc_testnet --broadcast --verify -vvvv --legacy`
   - Catat alamat factory ke `.env` (`BOUNTY_FACTORY`) DAN ke `agent-oracle/.env`
   - `source .env && forge script script/CreateBounty.s.sol:CreateBounty --rpc-url bsc_testnet --broadcast -vvvv --legacy` → catat alamat escrow
   - Tunjukin di BscScan: tx createBounty ada contract creation di dalamnya

## Segmen B: Oracle di BscScan (nol kode, Tab 2)

8. Bedah kontrak yang barusan ke-deploy (verified): baca `fulfillVerification` + `hanyaOracle` + `factory.oracle()`. Poin: kontrak percaya SATU ALAMAT, bukan "AI".
9. Demo "oracle manusia":
   - Worker submit: `cast send <ESCROW> "submitWork(string)" "<url proof>" --rpc-url $BSC_TESTNET_RPC --private-key $PRIVATE_KEY --legacy` (atau via BscScan Write Contract)
   - BscScan escrow → Write Contract → connect wallet kamu (masih oracle) → `fulfillVerification(true)` → hadiah cair TANPA AI. "Oracle itu cuma alamat. Sekarang kita ganti jarinya sama robot."
10. Rotasi ke agent: BscScan factory → Write Contract (wallet owner) → `setOracle(0x842013c675fd7318464d06D243cc494fbFD6ba17)`. Cek Read Contract `oracle()` berubah.

## Segmen C: AI agent jalan (Tab 2)

11. `cd agent-oracle && source .venv/bin/activate && python main.py` → dua baris pertama harus sama-sama `0x8420...`.
12. Bikin bounty baru (`CreateBounty` lagi), worker `submitWork` proof beneran → tunggu polling → verdict ELIGIBLE → cek BscScan: hadiah pindah, tx dari alamat agent.
13. Bonus: submit proof ngasal → DITOLAK → status balik Dibuka.
14. Tutup: fallback creator setelah deadline (baca fungsi `approveWork` versi baru), diskusi single-oracle vs produksi.

## Kalau ada masalah

- Verdict revert `BukanOracle` → `setOracle` belum jalan / salah alamat.
- Agent diem aja → cek `BOUNTY_FACTORY` di `agent-oracle/.env` + status bounty memang `Disubmit`.
- Gemini error 4xx → API key habis kuota / kehapus; ganti `LLM_API_KEY` di `agent-oracle/.env`.
- Setelah workshop: HAPUS API key Gemini + tarik sisa tBNB dari wallet agent.
