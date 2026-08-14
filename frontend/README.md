# Frontend — Papan Sayembara (Sesi 7)

Starter dApp UI untuk Papan Sayembara di **BNB Smart Chain Testnet**. Isinya baru kerangka:
template + komponen UI + alamat kontrak. Sisanya kita bangun bareng pas sesi.

Stack: Vite + React 19 + Tailwind v4 + shadcn/ui + **viem**. Sengaja tanpa wagmi, biar
kelihatan apa yang sebenarnya terjadi waktu wallet diminta tanda tangan.

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

1. MetaMask di jaringan **BSC Testnet** (nanti ditambahkan otomatis oleh tombol Sambungkan Wallet)
2. **tBNB** untuk gas → https://www.bnbchain.org/en/testnet-faucet
3. **RWD** untuk bikin bounty → https://faucet-rwd-web3jogja.netlify.app

## 3. Yang sudah disiapkan

| File                        | Isinya                                                    |
| --------------------------- | --------------------------------------------------------- |
| `src/lib/contracts.ts`      | alamat deployment + ABI + label status (sama dgn backend)  |
| `src/components/ui/*`       | komponen shadcn: Button, Card, Input, Tabs, Dialog, dll    |
| `src/app.tsx`               | kerangka halaman — masih kosong                            |

## 4. Yang kita bangun bareng

- [ ] `src/lib/chain.ts` — koneksi baca (RPC publik) & tulis (wallet peserta)
- [ ] `src/hooks/use-wallet.ts` — sambung MetaMask + pindah ke BSC Testnet
- [ ] `src/lib/api.ts` — ambil papan, peringkat, dan alasan juri AI dari backend
- [ ] `src/lib/actions.ts` — approve → createBounty → submitWork, ditandatangani sendiri
- [ ] Komponen: tombol wallet, kartu bounty, form bikin bounty, papan peringkat

## Kenapa tidak pakai relayer seperti Sesi 6?

Di Sesi 6 backend yang pegang private key — siapa pun yang bisa memanggil API bisa
membelanjakan dompet itu. Di Sesi 7 kuncinya tidak pernah keluar dari MetaMask: peserta
tanda tangan sendiri, dan backend cukup jadi pembaca data.
