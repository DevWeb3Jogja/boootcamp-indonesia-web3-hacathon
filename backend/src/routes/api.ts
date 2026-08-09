// routes/api.ts = definisi endpoint REST (Hono)

import { Hono } from "hono";
import { cors } from "hono/cors";
import { isAddress } from "viem";
import { getBoard } from "../lib/db";
import { balanceOf, board, readEscrow } from "../services/bounty";

export const app = new Hono();

app.use("/*", cors()); // izinkan frontend localhost memanggil API

app.onError((err, c) => {
  console.error("api error:", err);
  return c.json({ error: "internal error" }, 500);
});
app.notFound((c) => c.json({ error: "route tidak ditemukan" }, 404));

// GET /board → semua bounty + submission (hasil indexing + total live)
app.get("/board", async (c) => c.json(await board()));

// GET /bounty/:escrow → detail satu bounty (live dari chain)
app.get("/bounty/:escrow", async (c) => {
  const escrow = c.req.param("escrow");
  if (!isAddress(escrow)) return c.json({ error: "alamat tidak valid" }, 400);
  return c.json(await readEscrow(escrow));
});

// GET /wallet/:address → bounty yang dibuat + submission milik wallet tersebut
app.get("/wallet/:address", (c) => {
  const addr = c.req.param("address").toLowerCase();
  if (!isAddress(addr)) return c.json({ error: "alamat tidak valid" }, 400);
  const { bounties, submissions } = getBoard();
  return c.json({
    bounties: bounties.filter((b) => b.creator.toLowerCase() === addr),
    submissions: submissions.filter((s) => s.worker.toLowerCase() === addr),
  });
});

// GET /balance/:address → saldo token RWD
app.get("/balance/:address", async (c) => {
  const addr = c.req.param("address");
  if (!isAddress(addr)) return c.json({ error: "alamat tidak valid" }, 400);
  return c.json({ balance: (await balanceOf(addr)).toString() });
});

// GET /health → cek server hidup
app.get("/health", (c) => c.json({ ok: true, time: new Date().toISOString() }));