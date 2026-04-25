import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { jupApi } from "./jup-client.js";

import { getConnection } from "../solana-client.js";
import { getBalance, getTokenBalances } from "../wallet.js";
import { PublicKey } from "@solana/web3.js";

/**
 * Jupiter Portfolio API V1 — GET /portfolio/v1/positions/{address}
 * Returns token balances, deposits, and other DeFi positions for an address.
 */
export const portfolioTool = tool(
  async (input) => {
    try {
      let jupiterPositions = [];
      try {
        const { data } = await jupApi.get(`/portfolio/v1/positions/${input.address}`);
        jupiterPositions = data || [];
      } catch (e: any) {
        // Continue even if Jupiter API fails or has no positions
      }

      const conn = getConnection();
      const pubkey = new PublicKey(input.address);
      const solBalance = await getBalance(conn, pubkey);
      const standardTokens = await getTokenBalances(conn, pubkey);

      const combinedData = {
        solBalance,
        standardTokens: standardTokens.filter((t) => t.uiAmount > 0),
        jupiterPositions,
      };

      // Often portfolio responses can be large, we might just want to return a summary
      // Add explicit instructions to the LLM so it formats the output nicely for the user.
      const rawData = JSON.stringify(combinedData, null, 2);
      return `PORTFOLIO DATA:\n${rawData}\n\nCRITICAL INSTRUCTION FOR AI: Do NOT output raw JSON to the user. You MUST parse the above portfolio data and present it as a clean, easy-to-read markdown table or bulleted list showing their SOL balance, standard tokens, and Jupiter positions (if any).`;
    } catch (err: any) {
      return `Portfolio API error: ${err.message}`;
    }
  },
  {
    name: "jupiter_portfolio",
    description:
      "Check a wallet address's token balances, DeFi deposits, and holdings across Solana using Jupiter Portfolio API. Always present the results to the user in a clean, readable format.",
    schema: z.object({
      address: z
        .string()
        .describe("The Solana wallet address (base58 pubkey) to check balances and deposits for"),
    }),
  }
);
