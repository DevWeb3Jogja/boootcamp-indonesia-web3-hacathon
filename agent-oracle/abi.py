"""ABI minimal: cuma fungsi yang dipakai agent (baca registry + baca escrow + kirim verdict)."""

FACTORY_ABI = [
    {
        "type": "function",
        "name": "totalBounties",
        "inputs": [],
        "outputs": [{"type": "uint256"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "bounties",
        "inputs": [{"type": "uint256"}],
        "outputs": [{"type": "address"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "oracle",
        "inputs": [],
        "outputs": [{"type": "address"}],
        "stateMutability": "view",
    },
]

ESCROW_ABI = [
    {
        "type": "function",
        "name": "status",
        "inputs": [],
        "outputs": [{"type": "uint8"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "rulesURI",
        "inputs": [],
        "outputs": [{"type": "string"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "proofURI",
        "inputs": [],
        "outputs": [{"type": "string"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "worker",
        "inputs": [],
        "outputs": [{"type": "address"}],
        "stateMutability": "view",
    },
    {
        "type": "function",
        "name": "fulfillVerification",
        "inputs": [{"name": "eligible", "type": "bool"}],
        "outputs": [],
        "stateMutability": "nonpayable",
    },
]

STATUS_DISUBMIT = 2
