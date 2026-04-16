# JupiSuite — Full-Stack Jupiter AI Agent

> See the full detailed plan in the Antigravity artifact. This is the project-local summary.

## What We're Building

A TypeScript AI agent on **Solana Mainnet** that integrates the **complete Jupiter ecosystem** (all 8 APIs + AI Stack) with custom intelligence modules for market sentiment analysis and new token investigation.

## Jupiter APIs Integrated
1. **Swap V2** — `/order` + `/execute` (Meta-Aggregator) and `/build` (Router)
2. **Trigger** — Limit orders: single, OCO (TP/SL), OTOCO
3. **Price** — USD pricing for any SPL token
4. **Tokens** — Search, metadata, verification status, organic scores
5. **Lend** — Earn yield, borrow, flashloans
6. **Recurring** — Time-based DCA orders
7. **Prediction Markets** — Binary YES/NO event trading
8. **Perps** — Leveraged perpetuals (via Jupiter CLI)

## Jupiter AI Stack
- **Agent Skills** → System prompt context (`integrating-jupiter`, `jupiter-lend`)
- **Jupiter CLI** → Execution backend (`jup spot swap`, `jup perps open`, etc.)
- **Docs MCP** → Real-time doc queries at `dev.jup.ag/mcp`
- **llms.txt** → Full Jupiter docs as LLM knowledge base

## Custom Intelligence
- **Sentiment Engine** — Jupiter Price/Tokens data + Helius whale/holder signals → LLM scoring
- **Token Investigator** — Helius webhook for new mints → 7-check security audit → GemScore

## AI Agent Training Rules
- Always check sentiment before placing limit orders
- Always investigate tokens before trading new ones
- Max 10% wallet balance per trade
- Dry-run first, confirm second
- Never trade tokens scoring AVOID
