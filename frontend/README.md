# Frontend — Papan Sayembara (Sesi 7)

Starter dApp UI untuk Papan Sayembara di **BNB Smart Chain Testnet**. Isinya baru kerangka:
template + komponen UI + alamat kontrak. Sisanya kita bangun bareng pas sesi.

Stack: Vite + React 19 + Tailwind v4 + shadcn/ui. Sisanya dipasang pas sesi: **viem** +
**TanStack Query** di Bagian 1, lalu **RainbowKit + wagmi** di Bagian 2.

## 1. Jalankan

```bash
bun install
bun dev            # buka http://localhost:5173
```

Backend harus jalan lebih dulu di terminal lain:

```bash
cd ../backend && bun dev
```

> Backfill indexer butuh beberapa menit sebelum API menyala. Nyalakan backend duluan,
> baru siapkan frontend.

## 2. Siapkan wallet

1. MetaMask atau Binance Web3 Wallet — jaringan **BSC Testnet** (ditambahkan otomatis oleh RainbowKit)
2. **tBNB** untuk gas → https://www.bnbchain.org/en/testnet-faucet
3. **RWD** untuk bikin bounty → https://faucet-rwd-web3jogja.netlify.app
4. **WalletConnect projectId** (gratis) → https://cloud.reown.com — baru dibutuhkan di Bagian 2

## 3. Yang sudah disiapkan

| File                   | Isinya                                                   |
| ---------------------- | -------------------------------------------------------- |
| `src/lib/contracts.ts` | alamat deployment + label status (ABI menyusul pas sesi) |
| `src/components/ui/*`  | komponen shadcn: Button, Card, Input, Tabs, Dialog, dll  |
| `src/app.tsx`          | kerangka halaman — masih kosong                          |

## 4. Yang kita bangun bareng

**Bagian 1 — papan (tanpa wallet, tanpa projectId):**

- [ ] `bun add viem @tanstack/react-query`
- [ ] `src/providers.tsx` — QueryClientProvider
- [ ] `src/lib/api.ts` — ambil papan, peringkat, dan alasan juri AI dari backend
- [ ] `src/lib/format.ts`
- [ ] Komponen: kartu bounty, papan peringkat

**Bagian 2 — aksi (wallet peserta sendiri):**

- [ ] `bun add @rainbow-me/rainbowkit wagmi`
- [ ] `src/lib/wagmi.ts` + bungkus `providers.tsx` dengan Wagmi & RainbowKit
- [ ] `src/lib/actions.ts` — approve → createBounty → submitWork
- [ ] Komponen: tombol Connect, form bikin bounty, form kirim bukti

## Kenapa tidak pakai relayer seperti Sesi 6?

Di Sesi 6 backend yang pegang private key — siapa pun yang bisa memanggil API bisa
membelanjakan dompet itu. Di Sesi 7 kuncinya tidak pernah keluar dari wallet peserta:
mereka tanda tangan sendiri, dan backend cukup jadi pembaca data.

## Catatan versi

Proyek ini sengaja dikunci ke versi terbaru semua paket. Dua konsekuensinya:

- **RainbowKit belum mendukung wagmi v3**, jadi nanti kita pasang `src/shims/wagmi-connectors.ts`
  untuk menambal connector yang dihapus. Hapus file itu begitu RainbowKit rilis dukungannya.
- **typescript-eslint belum mendukung TypeScript 7**, jadi proyek ini pakai **Prettier** saja
  (`bun run format`), tanpa ESLint.
