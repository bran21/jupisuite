import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { jupApi } from "./jup-client.js";

/**
 * Jupiter Portfolio API V1 — GET /portfolio/v1/positions/{address}
 * Returns token balances, deposits, and other DeFi positions for an address.
 */
export const portfolioTool = tool(
  async (input) => {
    try {
      const { data } = await jupApi.get(`/portfolio/v1/positions/${input.address}`);

      // Often portfolio responses can be large, we might just want to return a summary
      // but returning the full or stringified JSON works for LangChain LLM to parse.
      return JSON.stringify(data, null, 2);
    } catch (err: any) {
      return `Portfolio API error: ${err.response?.data?.message || err.message}`;
    }
  },
  {
    name: "jupiter_portfolio",
    description:
      "Check a wallet address's token balances, DeFi deposits, and holdings across Solana using Jupiter Portfolio API.",
    schema: z.object({
      address: z
        .string()
        .describe("The Solana wallet address (base58 pubkey) to check balances and deposits for"),
    }),
  }
);
