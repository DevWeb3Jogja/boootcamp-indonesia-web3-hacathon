"""AI judge: nilai submission (proofURI) terhadap aturan bounty (rulesURI) pakai LLM."""

import json
import os

import requests

SYSTEM_PROMPT = (
    "Kamu adalah oracle verifikasi untuk Papan Sayembara (bounty board) on-chain. "
    "Tugasmu menilai apakah bukti kerjaan (proof) memenuhi aturan bounty (rules). "
    "Nilai dengan ketat: kalau bukti tidak jelas, tidak lengkap, atau tidak bisa dicek, tolak. "
    'Jawab HANYA dengan JSON valid: {"eligible": true/false, "alasan": "penjelasan singkat"}'
)


def _fetch_text(uri, max_chars=8000):
    """Ambil isi URI (rules/proof) best effort. Kalau gagal, kembalikan None."""
    url = uri
    if uri.startswith("ipfs://"):
        url = "https://ipfs.io/ipfs/" + uri[len("ipfs://") :]
    try:
        resp = requests.get(url, timeout=20)
        resp.raise_for_status()
        return resp.text[:max_chars]
    except Exception:
        return None


def judge_submission(rules_uri, proof_uri, worker):
    """Kembalikan (eligible: bool, alasan: str)."""
    rules_text = _fetch_text(rules_uri)
    proof_text = _fetch_text(proof_uri)

    user_prompt = json.dumps(
        {
            "rulesURI": rules_uri,
            "rules_isi": rules_text or "(gagal diambil, nilai dari URI saja)",
            "proofURI": proof_uri,
            "proof_isi": proof_text or "(gagal diambil, nilai dari URI saja)",
            "worker": worker,
        },
        ensure_ascii=False,
    )

    resp = requests.post(
        os.environ.get("LLM_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")
        + "/chat/completions",
        headers={"Authorization": f"Bearer {os.environ['LLM_API_KEY']}"},
        json={
            "model": os.environ.get("LLM_MODEL", "anthropic/claude-sonnet-4.5"),
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": 0,
        },
        timeout=120,
    )
    resp.raise_for_status()
    content = resp.json()["choices"][0]["message"]["content"].strip()

    if content.startswith("```"):
        content = content.strip("`")
        content = content[content.find("{") :]
    verdict = json.loads(content[content.find("{") : content.rfind("}") + 1])
    return bool(verdict["eligible"]), str(verdict.get("alasan", ""))
