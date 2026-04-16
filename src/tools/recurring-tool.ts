import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { jupApi } from "./jup-client.js";
import { signBase64Transaction } from "../solana-client.js";
import { getPublicKeyString } from "../wallet.js";

/**
 * Jupiter Recurring API — Time-based DCA orders.
 * API: api.jup.ag/recurring/v1/
 */
export const recurringTool = tool(
  async (input) => {
    try {
      const wallet = getPublicKeyString();

      switch (input.action) {
        case "create": {
          if (!input.inputMint || !input.outputMint || !input.amountPerCycle) {
            return "Error: inputMint, outputMint, and amountPerCycle are required.";
          }

          const cycleMap: Record<string, number> = {
            hourly: 3600,
            daily: 86400,
            weekly: 604800,
          };
          const cycleFrequency = cycleMap[input.cycleFrequency || "daily"] || 86400;

          const { data } = await jupApi.post("/recurring/v1/createOrder", {
            owner: wallet,
            inputMint: input.inputMint,
            outputMint: input.outputMint,
            amountPerCycle: input.amountPerCycle.toString(),
            cycleFrequency,
            totalCycles: input.totalCycles || 0, // 0 = infinite
          });

          if (data.transaction) {
            const signed = signBase64Transaction(data.transaction);
            const { data: result } = await jupApi.post("/recurring/v1/execute", {
              signedTransaction: signed,
            });
            return `✅ DCA order created!\n${JSON.stringify(result, null, 2)}`;
          }
          return `DCA order crafted:\n${JSON.stringify(data, null, 2)}`;
        }

        case "list": {
          const { data } = await jupApi.get("/recurring/v1/getRecurringOrders", {
            params: { wallet },
          });
          const orders = data?.orders || data || [];
          if (orders.length === 0) return "No active DCA orders found.";
          return `Your DCA Orders:\n${JSON.stringify(orders.slice(0, 20), null, 2)}`;
        }

        case "cancel": {
          if (!input.orderId) return "Error: orderId is required to cancel.";
          const { data } = await jupApi.post("/recurring/v1/cancelOrder", {
            owner: wallet,
            orderId: input.orderId,
          });
          if (data.transaction) {
            const signed = signBase64Transaction(data.transaction);
            const { data: result } = await jupApi.post("/recurring/v1/execute", {
              signedTransaction: signed,
            });
            return `✅ DCA order ${input.orderId} cancelled.\n${JSON.stringify(result, null, 2)}`;
          }
          return `Cancellation crafted:\n${JSON.stringify(data, null, 2)}`;
        }

        default:
          return `Unknown action: ${input.action}`;
      }
    } catch (err: any) {
      return `Recurring API error: ${err.response?.data?.message || err.message}`;
    }
  },
  {
    name: "jupiter_recurring",
    description:
      "Set up Dollar Cost Averaging (DCA) on Jupiter. Automatically buy a token on a recurring schedule (hourly, daily, weekly). Great for building positions gradually.",
    schema: z.object({
      action: z.enum(["create", "list", "cancel"]).describe("create: set up new DCA. list: view active DCAs. cancel: stop a DCA."),
      inputMint: z.string().optional().describe("Token you're selling per cycle (e.g. USDC mint)"),
      outputMint: z.string().optional().describe("Token you're accumulating (e.g. SOL mint)"),
      amountPerCycle: z.number().optional().describe("Amount of inputMint per cycle (in smallest unit)"),
      cycleFrequency: z.enum(["hourly", "daily", "weekly"]).optional().default("daily"),
      totalCycles: z.number().optional().describe("Total number of cycles. 0 or omit for infinite."),
      orderId: z.string().optional().describe("Order ID (for cancel)"),
    }),
  }
);
