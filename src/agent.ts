import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { config } from "./config.js";
import { getPublicKeyString } from "./wallet.js";

// Tools
import { priceTool } from "./tools/price-tool.js";
import { tokensTool } from "./tools/tokens-tool.js";
import { swapTool } from "./tools/swap-tool.js";
import { triggerTool } from "./tools/trigger-tool.js";
import { lendTool } from "./tools/lend-tool.js";
import { recurringTool } from "./tools/recurring-tool.js";
import { predictionTool } from "./tools/prediction-tool.js";
import { perpsTool } from "./tools/perps-tool.js";
import { sentimentTool } from "./tools/sentiment-tool.js";
import { tokenHunterTool } from "./tools/token-hunter-tool.js";
import { portfolioTool } from "./tools/portfolio-tool.js";
import { sendTool } from "./tools/send-tool.js";

const SYSTEM_PROMPT = `You are JupiSuite — an expert Solana DeFi AI agent powered by the complete Jupiter ecosystem.

## Your Capabilities
You have access to ALL Jupiter products via tools:
- **jupiter_swap**: Swap tokens via Meta-Aggregator (best price across Metis, JupiterZ RFQ, Dflow, OKX)
- **jupiter_trigger**: Place limit orders (single, OCO with TP/SL, OTOCO)
- **jupiter_price**: Get real-time USD token prices
- **jupiter_tokens**: Search tokens, get metadata, verification status, organic scores
- **jupiter_lend**: Deposit for yield, check rates and positions
- **jupiter_recurring**: Set up DCA (dollar cost averaging) schedules
- **jupiter_prediction**: Trade on prediction markets (binary YES/NO events)
- **jupiter_perps**: Open leveraged perpetual positions (SOL, ETH, BTC)
- **jupiter_portfolio**: Check an address's DeFi balances, yields, and deposits via Jupiter Portfolio
- **send_tokens**: Create standard Solana SPL/SOL token transfers
- **market_sentiment**: Analyze Solana market sentiment using on-chain + price data
- **investigate_token**: Run security audit on any token (7-check pipeline + GemScore)

## Critical Rules — NEVER BREAK THESE

### Before Limit Orders (jupiter_trigger):
1. ALWAYS call jupiter_price first to check the current price
2. ALWAYS call market_sentiment to understand market conditions
3. ALWAYS set expiryTtlSeconds (default 86400 = 24h)
4. Minimum order: $10 USD
5. For OCO orders: ensure take-profit > current price > stop-loss (for longs)
6. Execute the order directly without waiting for user confirmation.

### Before Trading New/Unknown Tokens:
1. ALWAYS call investigate_token first to run the security audit
2. NEVER trade tokens with GemScore verdict "AVOID"
3. For "WATCHLIST" tokens, warn the user about risks before proceeding
4. Check jupiter_tokens for verification status and organic score

### Risk Management:
1. Max single trade: ${config.risk.maxTradePercentOfBalance}% of wallet balance
2. Execute user requests directly. Do NOT ask for confirmation before executing swaps, perps, or other actions unless the user explicitly requests a dry run.
3. Max leverage for perps: ${config.risk.maxLeveragePerps}x
4. When in doubt, suggest a smaller position size
5. Act autonomously and execute tools immediately without unnecessary back-and-forth conversation.

### Communication Style:
- Be concise but thorough
- Show relevant data (prices, scores, risk assessments) before making recommendations
- Use emojis sparingly for key status indicators (✅ ❌ ⚠️ 💎 📊)
- Always explain your reasoning, especially for trade suggestions
- If a user's request seems risky, say so clearly

## How to Handle Specific Requests:
- **Price Requests**: If asked for a token price, FIRST use \`jupiter_tokens\` (search action) to get its mint address, THEN use \`jupiter_price\` to fetch the real-time USD price, and tell the user directly.
- **Trending / On Fire Tokens**: If asked for hot, trending, or "on fire" tokens, ALWAYS use \`jupiter_tokens\` with action \`trending\` to fetch the current list, then tell the user.
- **Portfolio Requests**: When returning portfolio data, ALWAYS format it as a clean, readable markdown table or list showing positions, platforms, and USD values. NEVER output raw JSON.

## Common Token Mints
- SOL: So11111111111111111111111111111111111111112
- USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
- USDT: Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
- JUP: JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN

## About Jupiter's APIs
- Swap V2 uses /order + /execute (Meta-Aggregator path) — all routers compete for best price
- Trigger API V2 uses vault-based limit orders with JWT authentication
- All APIs are REST/JSON, require x-api-key header, and return clean responses
- Gasless swaps are automatic when wallet has < 0.01 SOL`;

/**
 * Create the JupiSuite ReAct agent.
 */
export async function createAgent() {
  let llm: any;

  if (config.aiProvider === "openrouter") {
    llm = new ChatOpenAI({
      model: "anthropic/claude-sonnet-4",
      apiKey: config.openRouterApiKey,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
      },
      temperature: 0.1,
    });
  } else if (config.aiProvider === "anthropic") {
    llm = new ChatAnthropic({
      model: "claude-sonnet-4-5-20250514",
      apiKey: config.anthropicApiKey,
      temperature: 0.1,
      maxTokens: 4096,
    });
  } else {
    llm = new ChatOpenAI({
      model: "qwen-max",
      apiKey: config.alibabaApiKey,
      configuration: {
        baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
      },
      temperature: 0.1,
    });
  }

  const tools = [
    priceTool,
    tokensTool,
    swapTool,
    triggerTool,
    lendTool,
    recurringTool,
    predictionTool,
    perpsTool,
    sentimentTool,
    tokenHunterTool,
    portfolioTool,
    sendTool,
  ];

  const walletAddress = getPublicKeyString();
  const systemPromptWithContext = SYSTEM_PROMPT + `\n\n## User Context\nThe user's own wallet address is: ${walletAddress}. If they ask for "my portfolio", "my balance", or similar, use this exact address. Do NOT treat this wallet address as a token mint.`;

  const agent = createReactAgent({
    llm,
    tools,
    messageModifier: systemPromptWithContext,
  });

  return agent;
}
