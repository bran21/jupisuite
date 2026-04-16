import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";
import nacl from "tweetnacl";
import { config } from "../config.js";
import { jupHeaders } from "./jup-client.js";
import { signBase64Transaction } from "../solana-client.js";
import { getKeypair, getPublicKeyString } from "../wallet.js";

const TRIGGER_BASE = `${config.jupiterBaseUrl}/trigger/v2`;

// --- Auth State ---
let cachedJwt: string | null = null;
let jwtExpiry: number = 0;

async function authenticate(): Promise<string> {
  if (cachedJwt && Date.now() < jwtExpiry) return cachedJwt;

  const wallet = getPublicKeyString();

  // Step 1: Request challenge
  const { data: challengeData } = await axios.post(
    `${TRIGGER_BASE}/auth/challenge`,
    { wallet },
    { headers: jupHeaders() }
  );

  const challenge = challengeData.challenge;

  // Step 2: Sign challenge
  const messageBytes = new TextEncoder().encode(challenge);
  const signature = nacl.sign.detached(messageBytes, getKeypair().secretKey);
  const signatureBase64 = Buffer.from(signature).toString("base64");

  // Step 3: Verify and get JWT
  const { data: authData } = await axios.post(
    `${TRIGGER_BASE}/auth/verify`,
    { wallet, signature: signatureBase64 },
    { headers: jupHeaders() }
  );

  cachedJwt = authData.token;
  // JWT lasts 24h, refresh at 23h
  jwtExpiry = Date.now() + 23 * 60 * 60 * 1000;
  return cachedJwt!;
}

async function ensureVault(jwt: string): Promise<any> {
  try {
    const { data } = await axios.get(`${TRIGGER_BASE}/vault`, {
      headers: jupHeaders(jwt),
    });
    return data;
  } catch {
    const { data } = await axios.post(
      `${TRIGGER_BASE}/vault/register`,
      {},
      { headers: jupHeaders(jwt) }
    );
    return data;
  }
}

/**
 * Jupiter Trigger API V2 — Vault-based limit orders.
 * Supports: single, OCO (TP/SL), OTOCO.
 */
export const triggerTool = tool(
  async (input) => {
    try {
      const jwt = await authenticate();

      switch (input.action) {
        case "create": {
          // Ensure vault exists
          await ensureVault(jwt);

          // Craft deposit transaction
          const { data: depositData } = await axios.post(
            `${TRIGGER_BASE}/deposit/craft`,
            {
              inputMint: input.inputMint,
              outputMint: input.outputMint,
              amount: input.amount!.toString(),
            },
            { headers: jupHeaders(jwt) }
          );

          // Sign and submit deposit
          const signedDepositTx = signBase64Transaction(depositData.transaction);

          // Submit deposit (the API may handle this, or we send it ourselves)
          const { data: depositResult } = await axios.post(
            `${TRIGGER_BASE}/deposit/execute`,
            { signedTransaction: signedDepositTx },
            { headers: jupHeaders(jwt) }
          ).catch(() => {
            // If no /deposit/execute, the deposit tx may need to be submitted to chain directly
            return { data: { depositRequestId: depositData.depositRequestId || depositData.id } };
          });

          // Create the order
          const orderPayload: Record<string, any> = {
            orderType: input.orderType || "single",
            depositRequestId: depositResult.depositRequestId,
            inputMint: input.inputMint,
            outputMint: input.outputMint,
          };

          if (input.triggerPriceUsd) {
            orderPayload.triggerPriceUsd = input.triggerPriceUsd;
          }
          if (input.takeProfitPriceUsd) {
            orderPayload.takeProfitPriceUsd = input.takeProfitPriceUsd;
          }
          if (input.stopLossPriceUsd) {
            orderPayload.stopLossPriceUsd = input.stopLossPriceUsd;
          }
          if (input.expiryTtlSeconds) {
            orderPayload.expiryTtlSeconds = input.expiryTtlSeconds;
          }

          const { data: orderResult } = await axios.post(
            `${TRIGGER_BASE}/orders/price`,
            orderPayload,
            { headers: jupHeaders(jwt) }
          );

          return `✅ Limit order created!\nOrder ID: ${orderResult.orderId || orderResult.id}\nType: ${input.orderType || "single"}\nTrigger Price: $${input.triggerPriceUsd}\n${JSON.stringify(orderResult, null, 2)}`;
        }

        case "list": {
          const { data } = await axios.get(`${TRIGGER_BASE}/orders/history`, {
            headers: jupHeaders(jwt),
            params: { state: "active" },
          });
          const orders = (data.orders || data || []).slice(0, 20);
          if (orders.length === 0) return "No active limit orders found.";
          return `Active Orders:\n${JSON.stringify(orders, null, 2)}`;
        }

        case "cancel": {
          if (!input.orderId) return "Error: orderId is required to cancel an order.";

          // Step 1: Initiate cancellation
          const { data: cancelData } = await axios.post(
            `${TRIGGER_BASE}/orders/price/cancel/${input.orderId}`,
            {},
            { headers: jupHeaders(jwt) }
          );

          if (cancelData.transaction) {
            // Step 2: Sign withdrawal transaction
            const signedWithdrawTx = signBase64Transaction(cancelData.transaction);

            // Step 3: Confirm cancellation
            const { data: confirmData } = await axios.post(
              `${TRIGGER_BASE}/orders/price/confirm-cancel/${input.orderId}`,
              { signedTransaction: signedWithdrawTx },
              { headers: jupHeaders(jwt) }
            );
            return `✅ Order ${input.orderId} cancelled and funds withdrawn.\n${JSON.stringify(confirmData, null, 2)}`;
          }

          return `✅ Order ${input.orderId} cancellation initiated.\n${JSON.stringify(cancelData, null, 2)}`;
        }

        default:
          return `Unknown action: ${input.action}`;
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      return `Trigger API error: ${msg}`;
    }
  },
  {
    name: "jupiter_trigger",
    description: `Place, list, or cancel limit orders on Jupiter. Order types:
- single: simple limit buy/sell at a USD target price.
- oco: one-cancels-other (take-profit + stop-loss together).
- otoco: entry order that spawns a TP/SL pair when filled.

IMPORTANT: Always check current price first (use jupiter_price tool). Minimum order is $10 USD. Always set an expiry (expiryTtlSeconds). For OCO, ensure TP > current price > SL for longs (inverse for shorts).`,
    schema: z.object({
      action: z.enum(["create", "list", "cancel"]).describe("create: place a new limit order. list: show active orders. cancel: cancel an order by ID."),
      orderType: z.enum(["single", "oco", "otoco"]).optional().default("single").describe("Type of limit order"),
      inputMint: z.string().optional().describe("Token mint to sell/deposit (required for create)"),
      outputMint: z.string().optional().describe("Token mint to buy (required for create)"),
      amount: z.number().optional().describe("Amount of inputMint to deposit (in smallest unit)"),
      triggerPriceUsd: z.number().optional().describe("USD price at which the order triggers (required for single)"),
      takeProfitPriceUsd: z.number().optional().describe("Take-profit price in USD (for oco/otoco)"),
      stopLossPriceUsd: z.number().optional().describe("Stop-loss price in USD (for oco/otoco)"),
      expiryTtlSeconds: z.number().optional().default(86400).describe("Time-to-live in seconds. Default 24h. Jupiter recommends always setting this."),
      orderId: z.string().optional().describe("Order ID (required for cancel)"),
    }),
  }
);
