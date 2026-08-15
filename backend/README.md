# Backend Sesi 6 — Indexer + API + Juri AI

> Satu project, **dua perintah**: `bun dev` (indexer + REST API) dan `bun oracle` (juri AI).  
> Keduanya berbagi `src/` yang sama — config, koneksi chain, dan database cuma ditulis sekali.

Alternatif indexing otomatis ada di `../ponder` (Ponder = **index only**, GraphQL debug di :42069 — bukan API workshop).

Alur produknya: baca event chain (`getLogs` + `watchEvent`) → SQLite → sajikan lewat REST → juri AI ambil antrean dari SQLite yang sama, menilai, lalu kirim verdict balik ke chain.

## Quick start

```bash
bun install
cp .env.example .env    # isi RELAYER_PK, ORACLE_PK, LLM_API_KEY

# terminal 1: indexer + API
bun dev

# terminal 2: juri AI (butuh ORACLE_PK + LLM_API_KEY)
bun oracle

# test
curl http://localhost:3000/board
curl http://localhost:3000/health
```

## Dua wallet, dua peran

| Env          | Peran                                     | Butuh                                  |
| ------------ | ----------------------------------------- | -------------------------------------- |
| `RELAYER_PK` | panitia: `createBounty`, `submitWork`     | tBNB (gas) **dan** RWD (hadiah)        |
| `ORACLE_PK`  | juri: `fulfillVerification`               | tBNB saja, + didaftarkan via `setOracle` |

Keduanya opsional: kosongkan `RELAYER_PK` → `/relay/*` balas 503; kosongkan `ORACLE_PK` → `bun oracle` berhenti dengan pesan jelas. API baca tetap hidup tanpa keduanya.

## API endpoints

| Method | Route               | Deskripsi                                                      |
| ------ | ------------------- | -------------------------------------------------------------- |
| GET    | `/board`            | Semua bounty + submission (siapa posting apa, siapa klaim apa) |
| GET    | `/bounty/:escrow`   | Detail satu bounty (live dari chain, 6 view = 1 multicall)     |
| GET    | `/wallet/:address`  | Bounty & submission milik wallet tsb                           |
| GET    | `/balance/:address` | Saldo RWD token                                                |
| GET    | `/pending`          | Antrean submission yang menunggu penilaian (dipakai agent AI)  |
| GET    | `/leaderboard`      | Peringkat worker: jumlah menang + total reward                 |
| POST   | `/verdicts`         | Agent lapor hasil + **alasan** AI (chain cuma simpan true/false) |
| GET    | `/verdicts/:escrow` | Riwayat penilaian AI satu bounty                               |
| GET    | `/health`           | Cek server nyala + status relayer                              |

### Endpoint tulis (relayer) — butuh `RELAYER_PK`

Backend yang tanda tangan & bayar gas, jadi peserta bisa bikin bounty tanpa `cast`. Tanpa `RELAYER_PK` route ini balas `503` dan sisa API tetap jalan.

| Method | Route                          | Body                                              |
| ------ | ------------------------------ | ------------------------------------------------- |
| POST   | `/relay/bounty`                | `{ reward: "5", rules_uri, deadline_jam?: 24 }`   |
| POST   | `/relay/bounty/:escrow/submit` | `{ proof_uri }`                                   |

```bash
curl -X POST http://localhost:3000/relay/bounty -H 'content-type: application/json' \
  -d '{"reward":"5","rules_uri":"https://contoh.com/RULES.md"}'
# → {"hash":"0x...","escrow":"0x...","bountyId":4}
```

> ⚠️ **Ini pola kustodian, bukan pola web3 yang benar.** Backend menyimpan private key, jadi siapa pun yang bisa memanggil API-mu bisa membelanjakan dana wallet itu — dan semua bounty tercatat atas nama satu alamat. Dipakai di sini murni biar demo workshop gampang. Pola produksinya: user tanda tangan sendiri dari wallet-nya (materi Sesi 7).

## Arsitektur

```text
              backfill historis (getLogs per 999 block)
BNB Testnet ◄─────────────────────────────────────────────┐
    │                                                      │
    │  checkpoint per chunk → mati di tengah tinggal lanjut│
    ▼                                                      │
indexer/ ──► SQLite (papan-sayembara.db) ◄────────────────┘
    │                                                      │
    │  watchEvent (realtime, terus nyala)                  │
    └──────────────────────────────────────────────────────┘
              │
              ▼
    Hono API :3000
    ├─ GET /board      → semua data indexed
    ├─ GET /bounty/:id → detail live dari chain
    └─ GET /wallet/:a  → aktivitas per wallet
              │
              ▼
        nanti: Frontend
```

## File-file penting

| File                      | Isi                                          |
| ------------------------- | -------------------------------------------- |
| `src/config.ts`           | Konfigurasi: RPC, alamat kontrak, konstanta  |
| `src/contracts.ts`        | ABI + event definitions + label status       |
| `src/lib/chain.ts`        | viem public client (fallback + rank)         |
| `src/lib/wallet.ts`       | dua wallet (relayer + juri) — satu-satunya yang tanda tangan tx |
| `src/lib/db.ts`           | SQLite: skema, statement, query              |
| `src/indexer/handlers.ts` | Log chain → baris database                   |
| `src/indexer/backfill.ts` | Scan riwayat per chunk + checkpoint          |
| `src/indexer/watch.ts`    | Pantau event baru real-time                  |
| `src/services/bounty.ts`  | `readContract` + gabungan data on/off chain  |
| `src/services/relayer.ts` | `writeContract`: createBounty + submitWork   |
| `src/services/judge.ts`   | Juri AI: prompt + verdict JSON dari LLM      |
| `src/services/oracle.ts`  | `fulfillVerification` (wallet juri)          |
| `src/routes/api.ts`       | Endpoint REST (Hono)                         |
| `src/index.ts`            | Entry point 1 (`bun dev`): indexer + server  |
| `src/oracle.ts`           | Entry point 2 (`bun oracle`): loop juri AI   |

## Konsep inti

**`getLogs`** = minta node "kasih tau semua event X dari block A ke B".  
**`watchEvent`** = "tolong kabari kalau ada event X yang baru masuk".  
Keduanya pake HTTP RPC (public node) = gratis, tanpa WebSocket.

## Konfigurasi environment

Salin `.env.example` jadi `.env`:

| Variabel        | Wajib | Fungsi                                                          |
| --------------- | ----- | --------------------------------------------------------------- |
| `RPC_URL`       | tidak | RPC BSC Testnet pilihanmu; kosong = pakai daftar fallback       |
| `PORT`          | tidak | Port API Hono, default 3000                                     |
| `RELAYER_PK`    | tidak | Wallet panitia untuk `/relay/*`; kosong = route itu balas 503   |
| `ORACLE_PK`     | tidak | Wallet juri untuk `bun oracle`; kosong = juri tidak bisa jalan  |
| `LLM_BASE_URL`  | tidak | Endpoint OpenAI-compatible, default `https://api.openai.com/v1` |
| `LLM_API_KEY`   | juri  | Kunci LLM; cuma dibutuhkan kalau kamu menjalankan `bun oracle`  |
| `LLM_MODEL`     | tidak | Default `gpt-4o-mini`                                           |

Alamat kontrak tidak lewat `.env` — sudah hardcode di `src/config.ts` biar semua peserta menunjuk deployment yang sama.

## Catatan untuk produksi

- **Checkpointing:** block terakhir disimpen di `sync_checkpoint` per chunk → aman untuk restart.
- **Reorg:** `INSERT OR IGNORE` + `ON CONFLICT` + `tx_hash UNIQUE` = idempotent; reorg kecil gak ngerusak.
- **Rate limit:** kode udah fallback + rank beberapa RPC dan retry per chunk; kalau masih ketat, isi `RPC_URL` di `.env` dengan API key (NodeReal/ZAN).
