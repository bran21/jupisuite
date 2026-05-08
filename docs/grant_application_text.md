JupiSuite — Full-Stack Jupiter AI Agent built with Agentic Engineering

GitHub: https://github.com/bran21/jupisuite

I built JupiSuite, a full-stack AI agent that wraps the entire Jupiter DeFi protocol suite (Swap, Limit Orders, DCA, Lending, Perps, Prediction Markets, Portfolio, Token Analysis) into a single conversational CLI. Users interact with Solana DeFi through natural language instead of navigating multiple UIs.

How Agentic Engineering Was Used:

This entire project was built using agentic engineering via Claude. The AI coding session produced:

1. A LangChain ReAct agent with 12 tools, each wrapping a Jupiter API endpoint with Zod-validated schemas
2. Full Jupiter API integration: Swap V2 (Meta-Aggregator), Trigger V2 (vault-based limit orders with JWT auth), Recurring (DCA), Lend, Perps, Prediction Markets, Portfolio, Price V3, Tokens V2, Send
3. A 7-check token security audit pipeline with GemScore verdicts (STRONG GEM / POTENTIAL GEM / WATCHLIST / AVOID) — the agent refuses to trade AVOID tokens
4. A multi-source sentiment engine combining price momentum, trending tokens, and on-chain signals via Helius DAS into a Fear/Greed score (0-100)
5. Risk guardrails: max 10% wallet per trade, 10x leverage cap, mandatory price checks before limit orders

How This Grant Helps:
- Upgrade AI model access (Claude/GPT-4 for testing multi-step agent workflows)
- Helius RPC costs for on-chain sentiment analysis
- Mainnet testing for real swap and limit order validation

Tech: TypeScript, LangChain/LangGraph, Solana web3.js, Jupiter APIs (8 products), Helius DAS, Zod

Drive link with response files: [ADD YOUR GOOGLE DRIVE LINK HERE]
DX Report: https://github.com/bran21/jupisuite/blob/main/docs/developer_experience_report.md
