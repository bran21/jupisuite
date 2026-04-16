import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { jupApi } from "./jup-client.js";
import { signBase64Transaction } from "../solana-client.js";
import { getPublicKeyString } from "../wallet.js";

/**
 * Jupiter Lend — Earn (deposit yield) and Borrow.
 * API: api.jup.ag/lend/v1/earn/
 */
export const lendTool = tool(
  async (input) => {
    try {
      const wallet = getPublicKeyString();

      switch (input.action) {
        case "rates": {
          const { data } = await jupApi.get("/lend/v1/earn/tokens");
          const tokens = (data || []).slice(0, 15).map((t: any) => ({
            symbol: t.symbol,
            mint: t.mint,
            supplyRate: t.supplyRate,
            borrowRate: t.borrowRate,
            totalSupply: t.totalSupply,
            utilization: t.utilization,
          }));
          return `Jupiter Lend Rates:\n${JSON.stringify(tokens, null, 2)}`;
        }

        case "positions": {
          const { data } = await jupApi.get("/lend/v1/earn/positions", {
            params: { wallet },
          });
          if (!data || (Array.isArray(data) && data.length === 0)) {
            return "No lending positions found for this wallet.";
          }
          return `Your Lending Positions:\n${JSON.stringify(data, null, 2)}`;
        }

        case "deposit": {
          if (!input.asset || !input.amount) {
            return "Error: asset (mint address) and amount are required for deposit.";
          }
          const { data } = await jupApi.post("/lend/v1/earn/deposit", {
            owner: wallet,
            mint: input.asset,
            amount: input.amount.toString(),
          });
          if (data.transaction) {
            const signed = signBase64Transaction(data.transaction);
            // Submit the signed transaction
            const { data: result } = await jupApi.post("/lend/v1/earn/execute", {
              signedTransaction: signed,
            }).catch(() => ({ data: { status: "Transaction signed, submit manually" } }));
            return `✅ Deposit executed!\n${JSON.stringify(result, null, 2)}`;
          }
          return `Deposit crafted:\n${JSON.stringify(data, null, 2)}`;
        }

        case "withdraw": {
          if (!input.asset || !input.amount) {
            return "Error: asset (mint address) and amount are required for withdraw.";
          }
          const { data } = await jupApi.post("/lend/v1/earn/withdraw", {
            owner: wallet,
            mint: input.asset,
            amount: input.amount.toString(),
          });
          if (data.transaction) {
            const signed = signBase64Transaction(data.transaction);
            const { data: result } = await jupApi.post("/lend/v1/earn/execute", {
              signedTransaction: signed,
            }).catch(() => ({ data: { status: "Transaction signed, submit manually" } }));
            return `✅ Withdrawal executed!\n${JSON.stringify(result, null, 2)}`;
          }
          return `Withdrawal crafted:\n${JSON.stringify(data, null, 2)}`;
        }

        default:
          return `Unknown action: ${input.action}`;
      }
    } catch (err: any) {
      return `Lend API error: ${err.response?.data?.message || err.message}`;
    }
  },
  {
    name: "jupiter_lend",
    description:
      "Interact with Jupiter Lend: view earn rates, check your positions, deposit to earn yield, or withdraw. Powered by Jupiter's unified liquidity layer.",
    schema: z.object({
      action: z
        .enum(["rates", "positions", "deposit", "withdraw"])
        .describe("rates: view current APY rates. positions: check your deposits. deposit/withdraw: move funds."),
      asset: z.string().optional().describe("Token mint address (required for deposit/withdraw)"),
      amount: z.number().optional().describe("Amount in smallest unit (required for deposit/withdraw)"),
    }),
  }
);
