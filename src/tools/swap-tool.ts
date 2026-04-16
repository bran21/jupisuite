import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { jupApi } from "./jup-client.js";
import { signBase64Transaction } from "../solana-client.js";
import { getPublicKeyString } from "../wallet.js";

/**
 * Jupiter Swap API V2 — Meta-Aggregator path (/order + /execute)
 *
 * All routing engines compete: Metis, JupiterZ RFQ, Dflow, OKX.
 * Managed transaction landing, gasless support, MEV protection.
 */
export const swapTool = tool(
  async (input) => {
    try {
      const taker = getPublicKeyString();

      // Step 1: GET /swap/v2/order — get quote + assembled transaction
      const orderParams: Record<string, any> = {
        inputMint: input.inputMint,
        outputMint: input.outputMint,
        amount: input.amount.toString(),
        taker,
      };
      if (input.slippageBps) {
        orderParams.slippageBps = input.slippageBps;
      }

      const { data: orderData } = await jupApi.get("/swap/v2/order", {
        params: orderParams,
      });

      if (!orderData.transaction) {
        return `Swap order failed: ${JSON.stringify(orderData)}`;
      }

      // Preview info
      const preview = {
        inputAmount: orderData.inputAmount,
        outputAmount: orderData.outputAmount,
        priceImpact: orderData.priceImpactPct,
        routePlan: orderData.routePlan?.map((r: any) => ({
          amm: r.swapInfo?.label,
          percent: r.percent,
        })),
        gasless: orderData.gasless || false,
        requestId: orderData.requestId,
      };

      if (input.dryRun) {
        return `🔍 DRY RUN — Swap Preview:\n${JSON.stringify(preview, null, 2)}\n\nTo execute, run again with dryRun=false.`;
      }

      // Step 2: Sign the transaction
      const signedTx = signBase64Transaction(orderData.transaction);

      // Step 3: POST /swap/v2/execute — managed landing
      const { data: execData } = await jupApi.post("/swap/v2/execute", {
        signedTransaction: signedTx,
        requestId: orderData.requestId,
      });

      return `✅ Swap Executed!\nStatus: ${execData.status}\nSignature: ${execData.signature}\nInput: ${execData.inputAmountResult}\nOutput: ${execData.outputAmountResult}\n\nView: https://solscan.io/tx/${execData.signature}`;
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      return `Swap error: ${msg}`;
    }
  },
  {
    name: "jupiter_swap",
    description:
      "Swap tokens on Solana using Jupiter's Meta-Aggregator (best price across all routers including JupiterZ RFQ). Supports gasless swaps. ALWAYS set dryRun=true first to preview, then confirm with the user before executing with dryRun=false.",
    schema: z.object({
      inputMint: z.string().describe("Input token mint address (e.g. SOL mint: So11111111111111111111111111111111111111112)"),
      outputMint: z.string().describe("Output token mint address"),
      amount: z.number().describe("Amount in the smallest unit (lamports for SOL, etc)"),
      slippageBps: z.number().optional().describe("Slippage tolerance in basis points. Leave empty to let Jupiter's RTSE auto-estimate."),
      dryRun: z.boolean().default(true).describe("If true, only preview the swap without executing. ALWAYS start with true."),
    }),
  }
);
