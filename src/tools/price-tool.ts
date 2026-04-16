import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { jupApi } from "./jup-client.js";

/**
 * Jupiter Price API V3 — GET /price/v3?ids={mints}
 * Returns heuristics-based USD prices for up to 50 tokens.
 */
export const priceTool = tool(
  async (input) => {
    try {
      const ids = input.mints.join(",");
      const { data } = await jupApi.get(`/price/v3`, {
        params: { ids },
      });

      const prices: Record<string, any> = data.data || {};
      const results = Object.entries(prices).map(([mint, info]: [string, any]) => ({
        mint,
        priceUsd: info.price,
        buyPrice: info.buyPrice,
        sellPrice: info.sellPrice,
        confidence: info.confidence,
      }));

      if (results.length === 0) {
        return "No price data found for the given mints. Double-check the mint addresses.";
      }

      return JSON.stringify(results, null, 2);
    } catch (err: any) {
      return `Price API error: ${err.response?.data?.message || err.message}`;
    }
  },
  {
    name: "jupiter_price",
    description:
      "Get current USD prices for Solana tokens. Use this before placing any trade to know the current market price. Accepts up to 50 mint addresses.",
    schema: z.object({
      mints: z
        .array(z.string())
        .min(1)
        .max(50)
        .describe("Array of SPL token mint addresses (up to 50)"),
    }),
  }
);
