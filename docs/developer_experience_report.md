# Jupiter Developer Experience Report
Project Context: Built `jupisuite`, a full-stack AI Copilot for Jupiter using LangChain, Claude/Qwen, and Solana Web3.js.

1. Onboarding & First Call
Experience: Landing on developers.jup.ag to getting an API key via the portal was seamless. The first successful API call (Tokens/Price) took < 5 minutes.
Friction: The complexity spiked immediately when moving from read-only data to execution. The Perps integration took the longest because there is no REST API—we had to bridge the gap using the Jupiter CLI (`jup perps`) via `execSync` in Node.js, which feels brittle for a production AI agent.

2. Broken or Missing Docs
- Perps Integration: The [Perps documentation](https://dev.jup.ag/docs/perps/index.md) relies on a community Anchor IDL parser. For an ecosystem this mature, a first-party REST API (like Swap V2) is a glaring omission.
- Gasless Swap Nuances: The docs don't make it immediately obvious how adding certain parameters (like `payer` or `receiver`) silently alters routing algorithms (disabling JupiterZ/Dflow). We had to read the `SKILL.md` notes to figure out why routes were changing.

3. API Friction & Edge Cases (Where it bit us)
- Trigger API Dual-Auth: Requiring both `x-api-key` and a JWT (via a wallet challenge-response) makes building stateless AI agents incredibly painful. AI agents don't have persistent sessions easily; having to re-auth or manage JWTs across agent chains is a massive headache.
- Multi-step Orders: Trigger API requires registering a vault, crafting a deposit, signing, and then placing the order. AI models struggle with complex, stateful multi-step execution.
- Swap Error Codes: We encountered generic `-1001` (Aggregator Unknown error) during testing. Retry logic with exponential backoff is required, but the API could provide better granular hints on why it failed (e.g., slippage vs liquidity).

4. AI Stack & Skills
What worked: The `integrating-jupiter` SKILL file is phenomenal. The "Intent Router" table specifically saved hours of prompt engineering by telling the LLM exactly which endpoint to use for which intent.
What didn't: The LLM still had to write boilerplate code for Zod schemas and LangChain tool wrappers for every single Jupiter product.
What's missing: An official `@jup-ag/ai-tools` npm package that exposes native Langchain/Vercel AI tools. We spent 80% of our time writing `swap-tool.ts`, `perps-tool.ts`, etc., when Jupiter could just maintain these wrappers.

5. Rebuilding developers.jup.ag
Probably some of my suggestions that :
1. AI-First Abstractions: Devs aren't building UIs as much anymore; they are building agents. I would build a unified "Intent Execution API" where you send a JSON payload of what you want (swap, limit, DCA), and it returns a single base64 transaction. No vaults, no multi-step JWTs. 
2. First-Class Simulation: Devs need a way to say "If I run this, what exactly will happen?" before asking a user to sign. A global `/simulate` or `/preview` endpoint for all products (not just swap quote) would make building safe UIs and Agents much easier.

6. Wishlist
- REST API for Perps. (Please, no more CLI wrappers or Anchor IDL parsing).
- Official AI SDK: `@jup-ag/langchain` or `@jup-ag/ai-sdk` containing plug-and-play tools.
- API Key-only Auth for Triggers: Allow developer wallets (server-side) to place limit orders without the JWT challenge loop, assuming the API key is trusted.
- Built-in `dryRun` parameter across all execution endpoints that returns the exact state changes without needing on-chain simulation.
