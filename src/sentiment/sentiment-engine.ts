import { getPriceMomentum } from "./price-momentum.js";
import { getOnChainSignals } from "./on-chain-signals.js";

export interface SentimentReport {
  score: number; // 0-100
  label: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
  reasoning: string;
  timestamp: string;
  data: {
    solPrice?: number;
    trendingCount: number;
    recentTokenCount: number;
    topHolderConcentration?: number;
    totalHolders?: number;
  };
}

/**
 * Build the structured data payload for sentiment analysis.
 * The LLM will interpret this in the agent's reasoning loop.
 */
export async function gatherSentimentData(
  targetMint?: string
): Promise<string> {
  const mints = targetMint ? [targetMint] : [];
  const momentum = await getPriceMomentum(mints);

  let onChainInfo = "";
  if (targetMint) {
    const signals = await getOnChainSignals(targetMint);
    onChainInfo = `
On-Chain Signals for ${targetMint}:
- Recent transactions (last 50 sigs): ${signals.largeTransactions}
- Top 10 holder concentration: ${signals.topHolderConcentration.toFixed(1)}%
- Estimated total holders: ${signals.totalHolders}`;
  }

  const solPrice = momentum.prices.find(
    (p) => p.mint === "So11111111111111111111111111111111111111112"
  );

  const report = `
=== MARKET SENTIMENT DATA ===
Timestamp: ${new Date().toISOString()}

SOL Price: $${solPrice?.priceUsd?.toFixed(2) || "unknown"}

Token Prices:
${momentum.prices.map((p) => `  ${p.mint.slice(0, 8)}... = $${p.priceUsd.toFixed(6)}`).join("\n")}

Trending Tokens (${momentum.trending.length}):
${momentum.trending.map((t) => `  ${t.symbol} (${t.name})`).join("\n") || "  None available"}

Recently Listed Tokens (${momentum.recentTokens.length}):
${momentum.recentTokens.map((t) => `  ${t.symbol} — organic score: ${t.organicScore || "N/A"}`).join("\n") || "  None available"}
${onChainInfo}
=== END DATA ===

Based on this data, analyze the current Solana market sentiment.
Rate it on a scale of 0-100 where:
- 0-20: Extreme Fear
- 21-40: Fear
- 41-60: Neutral
- 61-80: Greed
- 81-100: Extreme Greed

Provide your score, label, and detailed reasoning.`;

  return report;
}
