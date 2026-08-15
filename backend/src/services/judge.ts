// services/judge.ts = juri AI: nilai proof vs rules lewat LLM (endpoint OpenAI-compatible)

import { LLM } from "../config";

const SYSTEM_PROMPT =
  "Kamu adalah oracle verifikasi untuk Papan Sayembara (bounty board) on-chain. " +
  "Tugasmu menilai apakah bukti kerjaan (proof) memenuhi aturan bounty (rules). " +
  "Nilai dengan ketat: kalau bukti tidak jelas, tidak lengkap, atau tidak bisa dicek, tolak. " +
  'Jawab HANYA dengan JSON valid: {"eligible": true/false, "alasan": "penjelasan singkat"}';

// Ambil isi URI (rules/proof) best effort; ipfs:// lewat gateway. Gagal = null.
const fetchText = async (uri: string, maxChars = 8000) => {
  const url = uri.startsWith("ipfs://") ? `https://ipfs.io/ipfs/${uri.slice(7)}` : uri;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) throw new Error(String(res.status));
    return (await res.text()).slice(0, maxChars);
  } catch {
    return null;
  }
};

export const judgeSubmission = async (rulesUri: string, proofUri: string, worker: string) => {
  // Proof/rules dibungkus sebagai DATA di dalam JSON, bukan instruksi (mitigasi prompt injection)
  const soal = JSON.stringify({
    rulesURI: rulesUri,
    rules_isi: (await fetchText(rulesUri)) ?? "(gagal diambil, nilai dari URI saja)",
    proofURI: proofUri,
    proof_isi: (await fetchText(proofUri)) ?? "(gagal diambil, nilai dari URI saja)",
    worker,
  });

  const res = await fetch(`${LLM.baseUrl}/chat/completions`, {
    method: "POST",
    headers: { authorization: `Bearer ${LLM.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: LLM.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: soal },
      ],
      temperature: 0, // juri konsisten, bukan kreatif
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`LLM ${res.status}: ${await res.text()}`);
  const content: string = (await res.json()).choices[0].message.content;

  // Ambil objek JSON dari jawaban (kadang AI bungkus pakai ```)
  const verdict = JSON.parse(content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1));
  return { eligible: Boolean(verdict.eligible), alasan: String(verdict.alasan ?? "") };
};
