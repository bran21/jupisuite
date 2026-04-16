import dotenv from "dotenv";
dotenv.config();

export const config = {
  // Wallet
  walletPrivateKey: process.env.WALLET_PRIVATE_KEY || "",

  // Jupiter
  jupiterApiKey: process.env.JUPITER_API_KEY || "",
  jupiterBaseUrl: "https://api.jup.ag",

  // Helius
  heliusApiKey: process.env.HELIUS_API_KEY || "",

  // Birdeye (optional)
  birdeyeApiKey: process.env.BIRDEYE_API_KEY || "",

  // LLM
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",

  // Solana RPC
  solanaRpcUrl:
    process.env.SOLANA_RPC_URL ||
    (process.env.HELIUS_API_KEY
      ? `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
      : "https://api.mainnet-beta.solana.com"),

  // Risk guardrails
  risk: {
    maxTradePercentOfBalance: 10, // max 10% of wallet per trade
    requireConfirmation: true, // always ask before executing
    dryRunFirst: true, // always --dry-run before real execution
    minLimitOrderUsd: 10, // Jupiter minimum
    maxLeveragePerps: 10, // cap leverage even though Jupiter allows 100x
  },

  // Webhook listener port (for Helius new token alerts)
  webhookPort: parseInt(process.env.WEBHOOK_PORT || "3456", 10),
} as const;

export function validateConfig(): string[] {
  const missing: string[] = [];
  if (!config.walletPrivateKey) missing.push("WALLET_PRIVATE_KEY");
  if (!config.jupiterApiKey) missing.push("JUPITER_API_KEY");
  if (!config.anthropicApiKey) missing.push("ANTHROPIC_API_KEY");
  return missing;
}
