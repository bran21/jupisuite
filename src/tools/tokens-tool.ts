import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { jupApi } from "./jup-client.js";

/**
 * Jupiter Tokens API V2 — search, metadata, verification, organic scores.
 */
export const tokensTool = tool(
  async (input) => {
    try {
      switch (input.action) {
        case "search": {
          const { data } = await jupApi.get("/tokens/v2/search", {
            params: { query: input.query },
          });
          const tokens = (data || []).slice(0, 10).map((t: any) => ({
            name: t.name,
            symbol: t.symbol,
            mint: t.address,
            verified: t.verified,
            organicScore: t.organicScore,
            holderCount: t.holderCount,
            marketCap: t.marketCap,
            dailyVolume: t.dailyVolume,
          }));
          return JSON.stringify(tokens, null, 2);
        }

        case "info": {
          const { data } = await jupApi.get("/tokens/v2/search", {
            params: { query: input.query },
          });
          const token = (data || [])[0];
          if (!token) return `No token found for "${input.query}"`;
          return JSON.stringify(
            {
              name: token.name,
              symbol: token.symbol,
              mint: token.address,
              decimals: token.decimals,
              verified: token.verified,
              organicScore: token.organicScore,
              holderCount: token.holderCount,
              marketCap: token.marketCap,
              dailyVolume: token.dailyVolume,
              tags: token.tags,
            },
            null,
            2
          );
        }

        case "recent": {
          const { data } = await jupApi.get("/tokens/v2/recent");
          const tokens = (data || []).slice(0, 15).map((t: any) => ({
            name: t.name,
            symbol: t.symbol,
            mint: t.address,
            verified: t.verified,
            organicScore: t.organicScore,
          }));
          return JSON.stringify(tokens, null, 2);
        }

        case "trending": {
          const { data } = await jupApi.get("/tokens/v2/content/cooking");
          const tokens = (data || []).slice(0, 15).map((t: any) => ({
            name: t.name,
            symbol: t.symbol,
            mint: t.mint || t.address,
          }));
          return JSON.stringify(tokens, null, 2);
        }

        default:
          return `Unknown action: ${input.action}`;
      }
    } catch (err: any) {
      return `Tokens API error: ${err.response?.data?.message || err.message}`;
    }
  },
  {
    name: "jupiter_tokens",
    description:
      "Search for Solana tokens, get metadata (verification status, organic score, holder count, market cap), find recently listed tokens, or see what's trending. Always use this to look up a token before trading.",
    schema: z.object({
      action: z
        .enum(["search", "info", "recent", "trending"])
        .describe(
          "search: find tokens by name/symbol/mint. info: detailed metadata for one token. recent: newly listed tokens. trending: currently hot tokens."
        ),
      query: z
        .string()
        .optional()
        .describe("Token name, symbol, or mint address (required for search/info)"),
    }),
  }
);
