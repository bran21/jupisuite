<![CDATA[<div align="center">

# 🟣 JupiSuite

### AI-Powered DeFi Copilot for the Entire Jupiter Ecosystem on Solana

[![Solana](https://img.shields.io/badge/Network-Solana_Mainnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![Jupiter](https://img.shields.io/badge/Powered_By-Jupiter-31D0AA?style=for-the-badge)](https://jup.ag)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![LangChain](https://img.shields.io/badge/LangChain-ReAct_Agent-1C3C3C?style=for-the-badge)](https://langchain.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Talk to Solana like you talk to a friend.**  
Swap, trade perps, set limit orders, DCA, lend, predict markets — all through natural language.

[Features](#-features) · [Architecture](#-architecture) · [Quick Start](#-quick-start) · [Tools](#-tool-suite-12-integrated-tools) · [Developer Report](#-developer-experience-report)

</div>

---

## 🧠 What is JupiSuite?

JupiSuite is a **full-stack AI agent** that wraps the entire Jupiter DeFi protocol suite into a single, conversational interface. Instead of navigating multiple UIs and signing separate transactions, you simply tell JupiSuite what you want:

```
JupiSuite > "Swap 0.5 SOL for USDC, then set a limit order to buy back at $120"
```

The agent autonomously resolves token mints, fetches live prices, checks market sentiment, executes the swap via Jupiter's Meta-Aggregator, authenticates with the Trigger API, and places your limit order — all in one conversation turn.

### Why This Matters

DeFi interfaces assume users understand routing, slippage, mints, and multi-step transaction flows. **JupiSuite removes that barrier entirely.** It's an autonomous agent that thinks, plans, and executes — turning intent into on-chain action.

---

## ✨ Features

| Category | Capability | Description |
|---|---|---|
| 🔄 **Trading** | Swap | Meta-Aggregator routing (Metis, JupiterZ RFQ, Dflow, OKX) with MEV protection |
| 📊 **Trading** | Limit Orders | Single, OCO (TP/SL), OTOCO orders via Trigger API V2 with JWT auth |
| 💹 **Trading** | Perpetuals | Leveraged long/short positions (SOL, ETH, BTC) with configurable leverage caps |
| 📈 **DCA** | Dollar Cost Averaging | Automated recurring buys (hourly, daily, weekly schedules) |
| 🏦 **Yield** | Lending | Deposit/withdraw for yield via Jupiter Lend |
| 🎯 **Prediction** | Markets | Trade binary YES/NO events (sports, crypto, politics) |
| 📦 **Portfolio** | Tracker | Unified view of SOL, SPL tokens, and Jupiter positions |
| 💸 **Transfers** | Send | Native SOL and SPL token transfers with auto ATA creation |
| 🔍 **Analysis** | Token Investigation | 7-check security audit pipeline with GemScore verdict |
| 📡 **Analysis** | Sentiment Engine | On-chain signals + price momentum → Fear/Greed index |
| 💰 **Data** | Price Feed | Real-time USD prices via Jupiter Price API V3 |
| 🪙 **Data** | Token Search | Search, trending, verification status, organic scores |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER (CLI / API)                         │
└──────────────────────────┬───────────────────────────────────────┘
                           │ Natural Language
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    LangChain ReAct Agent                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ Claude (3.5)  │  │ Qwen-Max     │  │ OpenRouter (any)     │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                  │
│  System Prompt: Intent routing, risk guardrails, token mints     │
└──────────────────────────┬───────────────────────────────────────┘
                           │ Tool Calls (Zod-validated)
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     12 LangChain Tools                           │
│                                                                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ jupiter_swap│ │jupiter_trigger│ │jupiter_perps│ │jupiter_   │ │
│  │ (Swap V2)   │ │ (Trigger V2)│ │   (CLI)     │ │recurring  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │jupiter_lend │ │jupiter_     │ │jupiter_     │ │jupiter_   │ │
│  │ (Earn API)  │ │prediction   │ │portfolio    │ │price      │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │jupiter_     │ │send_tokens  │ │market_      │ │investigate│ │
│  │tokens       │ │ (SOL/SPL)   │ │sentiment    │ │_token     │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└──────────────────────────┬───────────────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Jupiter APIs │  │ Solana RPC   │  │ Helius DAS   │
│ (api.jup.ag) │  │ (web3.js)    │  │ (Analytics)  │
│              │  │              │  │              │
│ • Swap V2    │  │ • Sign Tx    │  │ • Holders    │
│ • Trigger V2 │  │ • Simulate   │  │ • Token Accs │
│ • Lend V1    │  │ • Balance    │  │ • Tx History │
│ • Recurring  │  │ • Transfer   │  │              │
│ • Prediction │  │              │  │              │
│ • Price V3   │  │              │  │              │
│ • Tokens V2  │  │              │  │              │
│ • Portfolio  │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Key Design Decisions

- **ReAct Agent Pattern**: The agent reasons step-by-step (Thought → Action → Observation → ...) using LangChain's `createReactAgent`. This allows multi-tool chaining — e.g., checking price → analyzing sentiment → placing a limit order — in a single conversation turn.
- **Zod Schema Validation**: Every tool has a strict Zod schema. The LLM generates structured tool calls, not raw API requests. This prevents hallucinated parameters from reaching Jupiter's APIs.
- **Risk Guardrails in System Prompt**: Max 10% of wallet per trade, mandatory price checks before limit orders, forced security audits before trading unknown tokens, capped leverage at 10x.
- **JWT Auth Caching**: The Trigger API's challenge-response auth is handled transparently — JWTs are cached for 23 hours so the agent doesn't re-authenticate on every limit order.

---

## 🔐 Security: Token Investigation Pipeline

Before the agent trades any unknown token, it runs a **7-check security audit**:

| # | Check | What It Detects |
|---|---|---|
| 1 | **Mint Authority** | Can the creator print unlimited tokens? |
| 2 | **Freeze Authority** | Can transfers be frozen? (Honeypot risk) |
| 3 | **Jupiter Verification** | Is the token verified on Jupiter? |
| 4 | **Organic Score** | Is the trading activity real or botted? |
| 5 | **Liquidity Check** | Does a swap route exist? |
| 6 | **Holder Concentration** | Do top 10 wallets hold >70% supply? |
| 7 | **GemScore Composite** | Weighted security (50%) + liquidity (30%) + organic (20%) |

**Verdicts**: `STRONG GEM 💎` · `POTENTIAL GEM 🔍` · `WATCHLIST 👀` · `AVOID 🚫`

The agent **refuses to trade** tokens with an AVOID verdict.

---

## 📡 Sentiment Engine

JupiSuite's sentiment analysis combines multiple real-time data sources:

- **Price Momentum**: SOL, USDC, USDT, JUP prices via Jupiter Price API V3
- **Trending Tokens**: Jupiter's `/tokens/v2/content/cooking` endpoint
- **Recently Listed**: New tokens with organic scores via `/tokens/v2/recent`
- **On-Chain Signals** (per token): Top holder concentration, transaction velocity, total holders via Helius DAS
- **Output**: Fear/Greed score (0-100) with label and reasoning, interpreted by the LLM

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- A Solana wallet (private key in base58)
- [Jupiter API Key](https://developers.jup.ag/portal)
- [Helius API Key](https://helius.dev)
- LLM API key (Anthropic, Alibaba/Qwen, or OpenRouter)

### Installation

```bash
git clone https://github.com/bran21/jupisuite.git
cd jupisuite
npm install
```

### Configuration

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
WALLET_PRIVATE_KEY=your_base58_private_key
JUPITER_API_KEY=your_jupiter_api_key
HELIUS_API_KEY=your_helius_api_key

AI_PROVIDER=anthropic          # or alibaba, openrouter
ANTHROPIC_API_KEY=sk-ant-...   # if using Anthropic
```

### Run

```bash
npm run dev
```

### Example Session

```
╔══════════════════════════════════════════════════════╗
║  JupiSuite — Full-Stack Jupiter AI Agent             ║
║  Swap · Limits · DCA · Lend · Perps · Predictions    ║
║  + Market Sentiment · Token Investigation            ║
╚══════════════════════════════════════════════════════╝

🔑 Wallet: 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU
💰 Balance: 2.4521 SOL
🌐 Network: Solana Mainnet
🤖 LLM: Claude (Anthropic)

JupiSuite > What's the sentiment on BONK right now?

🔄 Thinking...

📊 BONK Market Sentiment Analysis
Score: 62/100 — Greed
• SOL Price: $168.42
• BONK Organic Score: 78/100 — healthy activity
• Top 10 holders control 34.2% of supply (distributed ✅)
• 50 recent transactions detected — moderate velocity
• Trending: BONK is currently in Jupiter's "What's Cooking" list 🔥

Verdict: Market sentiment is mildly bullish with healthy organic
activity and reasonable holder distribution.

JupiSuite > Swap 0.1 SOL for BONK

✅ Swap Executed!
Status: success
Signature: 5UxJ...k9Qm
Input: 100000000 lamports
Output: 14,233,891 BONK
View: https://solscan.io/tx/5UxJ...k9Qm
```

---

## 🔧 Tool Suite (12 Integrated Tools)

<details>
<summary><b>jupiter_swap</b> — Meta-Aggregator token swaps</summary>

Executes via Jupiter Swap V2 (`/order` + `/execute`). All routing engines compete: Metis, JupiterZ RFQ, Dflow, OKX. Supports gasless swaps, MEV protection, and managed transaction landing. Includes `dryRun` mode for previewing routes without execution.
</details>

<details>
<summary><b>jupiter_trigger</b> — Limit orders (Single, OCO, OTOCO)</summary>

Full Trigger API V2 integration with vault-based orders. Handles the complete flow: JWT authentication → vault registration → deposit crafting → order placement. Supports take-profit/stop-loss pairs and time-to-live expiry.
</details>

<details>
<summary><b>jupiter_perps</b> — Leveraged perpetuals</summary>

Trade SOL, ETH, BTC with configurable leverage (capped at 10x for safety). Uses Jupiter CLI for execution with JSON output parsing. Includes dry-run mode and position management.
</details>

<details>
<summary><b>jupiter_recurring</b> — DCA automation</summary>

Set up dollar cost averaging on hourly, daily, or weekly schedules. Supports infinite or fixed-cycle orders. Full lifecycle: create, list, and cancel recurring orders.
</details>

<details>
<summary><b>jupiter_lend</b> — Yield earning</summary>

View current supply/borrow rates, check positions, deposit for yield, and withdraw. Powered by Jupiter's unified liquidity layer.
</details>

<details>
<summary><b>jupiter_prediction</b> — Prediction markets</summary>

Trade binary YES/NO events. Search events, view market details, buy positions, check P&L, and claim winning payouts. Settled in USDC.
</details>

<details>
<summary><b>jupiter_portfolio</b> — Portfolio tracker</summary>

Unified view combining Jupiter Portfolio API positions with on-chain SOL/SPL token balances. Auto-formats data into readable tables for the user.
</details>

<details>
<summary><b>jupiter_price</b> — Real-time prices</summary>

USD token prices via Jupiter Price API V3 with confidence levels.
</details>

<details>
<summary><b>jupiter_tokens</b> — Token search & discovery</summary>

Search tokens by name/symbol/mint, browse trending tokens ("What's Cooking"), view verification status and organic scores.
</details>

<details>
<summary><b>send_tokens</b> — SOL/SPL transfers</summary>

Standard Solana transfers with automatic Associated Token Account creation for recipients who don't have one yet.
</details>

<details>
<summary><b>market_sentiment</b> — Fear & Greed analysis</summary>

Aggregates price momentum, trending tokens, recently listed tokens, and on-chain holder analysis into a 0-100 sentiment score.
</details>

<details>
<summary><b>investigate_token</b> — Security auditor</summary>

7-check security pipeline: mint authority, freeze authority, Jupiter verification, organic score, liquidity, holder concentration, and composite GemScore.
</details>

---

## 🛡 Risk Management

JupiSuite is opinionated about safety:

| Rule | Value | Rationale |
|---|---|---|
| Max trade size | 10% of wallet | Prevents catastrophic single-trade losses |
| Leverage cap | 10x | Jupiter allows 100x, but agent caps for safety |
| Pre-trade audit | Mandatory for unknown tokens | Agent refuses AVOID-verdict tokens |
| Price check | Required before limit orders | Prevents orders at absurd prices |
| Sentiment check | Required before limit orders | Context-aware order placement |
| Minimum order | $10 USD | Jupiter's Trigger API minimum |

---

## 🛠 Development

```bash
npm run build     # Compile TypeScript → dist/
npm run start     # Run production build
npm run dev       # Development mode (tsx hot reload)
npm run test      # Run test suite (Vitest)
```

---

## 📝 Tech Stack

| Layer | Technology |
|---|---|
| Agent Framework | LangChain + LangGraph (ReAct agent) |
| LLM Providers | Anthropic Claude, Alibaba Qwen, OpenRouter |
| Blockchain | Solana web3.js, SPL Token |
| DeFi Protocol | Jupiter (Swap V2, Trigger V2, Lend, Recurring, Prediction, Perps, Price V3, Tokens V2, Portfolio) |
| Analytics | Helius DAS API |
| Validation | Zod schemas |
| Language | TypeScript 5.6 |
| Runtime | Node.js 18+ |

---

## 📄 Developer Experience Report

We documented our full developer experience building JupiSuite in [`docs/developer_experience_report.md`](docs/developer_experience_report.md) — covering onboarding friction, API edge cases, broken docs, and our wishlist for Jupiter's developer platform.

---

## 📜 License

MIT — built with ❤️ for the Solana ecosystem.

<div align="center">
<br/>
<b>Built during the Solana Frontier Hackathon 2026</b>
<br/>
<sub>Powered by Jupiter · LangChain · Helius · Solana</sub>
</div>
]]>
