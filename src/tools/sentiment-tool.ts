import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { gatherSentimentData } from "../sentiment/sentiment-engine.js";

/**
 * Market Sentiment Tool — gathers real data and asks the LLM to interpret it.
 * The agent's ReAct loop will process the data and form a sentiment opinion.
 */
export const sentimentTool = tool(
  async (input) => {
    try {
      const report = await gatherSentimentData(input.mint);
      return report;
    } catch (err: any) {
      return `Sentiment analysis error: ${err.message}`;
    }
  },
  {
    name: "market_sentiment",
    description:
      "Analyze current Solana market sentiment using real-time price data, trending tokens, and on-chain metrics. Returns structured data that you must interpret to determine if the market is in Fear, Neutral, or Greed mode. You MUST use this tool before placing any limit order to ensure proper price targets.",
    schema: z.object({
      mint: z
        .string()
        .optional()
        .describe(
          "Optional: specific token mint address for token-level sentiment. Omit for overall Solana market."
        ),
    }),
  }
);
