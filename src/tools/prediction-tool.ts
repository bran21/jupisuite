import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { jupApi } from "./jup-client.js";
import { signBase64Transaction } from "../solana-client.js";
import { getPublicKeyString } from "../wallet.js";

/**
 * Jupiter Prediction Markets — Binary YES/NO event trading.
 * API: api.jup.ag/prediction/v1/
 */
export const predictionTool = tool(
  async (input) => {
    try {
      const wallet = getPublicKeyString();

      switch (input.action) {
        case "listEvents": {
          const params: Record<string, any> = {};
          if (input.eventSearch) params.query = input.eventSearch;

          const endpoint = input.eventSearch
            ? "/prediction/v1/events/search"
            : "/prediction/v1/events";

          const { data } = await jupApi.get(endpoint, { params });
          const events = (data.events || data || []).slice(0, 10).map((e: any) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            status: e.status,
            markets: e.markets?.length || 0,
          }));
          return `Prediction Events:\n${JSON.stringify(events, null, 2)}`;
        }

        case "market": {
          if (!input.marketId) return "Error: marketId required.";
          const { data } = await jupApi.get(`/prediction/v1/markets/${input.marketId}`);
          return `Market Details:\n${JSON.stringify(data, null, 2)}`;
        }

        case "buy": {
          if (!input.marketId || input.side === undefined) {
            return "Error: marketId and side (yes/no) required.";
          }
          const { data } = await jupApi.post("/prediction/v1/orders", {
            ownerPubkey: wallet,
            marketId: input.marketId,
            isYes: input.side === "yes",
            isBuy: true,
            amount: input.amount?.toString(),
          });
          if (data.transaction) {
            const signed = signBase64Transaction(data.transaction);
            // Submit to chain
            return `✅ Prediction order placed!\nSide: ${input.side?.toUpperCase()}\n${JSON.stringify(data, null, 2)}`;
          }
          return `Order crafted:\n${JSON.stringify(data, null, 2)}`;
        }

        case "positions": {
          const { data } = await jupApi.get("/prediction/v1/positions", {
            params: { owner: wallet },
          });
          const positions = data.positions || data || [];
          if (positions.length === 0) return "No prediction market positions.";
          return `Your Positions:\n${JSON.stringify(positions.slice(0, 20), null, 2)}`;
        }

        case "claim": {
          if (!input.positionPubkey) return "Error: positionPubkey required.";
          const { data } = await jupApi.post(
            `/prediction/v1/positions/${input.positionPubkey}/claim`
          );
          if (data.transaction) {
            const signed = signBase64Transaction(data.transaction);
            return `✅ Payout claimed!\n${JSON.stringify(data, null, 2)}`;
          }
          return `Claim crafted:\n${JSON.stringify(data, null, 2)}`;
        }

        default:
          return `Unknown action: ${input.action}`;
      }
    } catch (err: any) {
      return `Prediction API error: ${err.response?.data?.message || err.message}`;
    }
  },
  {
    name: "jupiter_prediction",
    description:
      "Trade on prediction markets (binary YES/NO events like sports, crypto, politics). Search events, view markets, buy positions, check your P&L, and claim winning payouts. Settled in USDC.",
    schema: z.object({
      action: z.enum(["listEvents", "market", "buy", "positions", "claim"]),
      eventSearch: z.string().optional().describe("Search query for events"),
      marketId: z.string().optional().describe("Market ID (for market details or buying)"),
      side: z.enum(["yes", "no"]).optional().describe("YES or NO side (for buy)"),
      amount: z.number().optional().describe("Amount in USDC micro-units (for buy)"),
      positionPubkey: z.string().optional().describe("Position public key (for claim)"),
    }),
  }
);
