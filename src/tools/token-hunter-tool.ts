import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { runSecurityCheck } from "../token-hunter/security-checker.js";
import { computeGemScore, formatGemReport } from "../token-hunter/gem-scorer.js";

/**
 * Token Hunter Tool — on-demand investigation of any Solana token.
 */
export const tokenHunterTool = tool(
  async (input) => {
    try {
      const report = await runSecurityCheck(input.mintAddress);
      const gemScore = computeGemScore(report);
      return formatGemReport(report, gemScore);
    } catch (err: any) {
      return `Token investigation error: ${err.message}`;
    }
  },
  {
    name: "investigate_token",
    description:
      "Investigate a Solana token for safety and opportunity. Runs a 7-check security audit (mint authority, freeze authority, Jupiter verification, organic score, liquidity, sell simulation, holder concentration) and produces a GemScore (0-100) with a verdict: AVOID, WATCHLIST, POTENTIAL GEM, or STRONG GEM. You MUST use this tool before trading any new or unfamiliar token. NEVER trade tokens that score AVOID.",
    schema: z.object({
      mintAddress: z.string().describe("The SPL token mint address to investigate"),
    }),
  }
);
