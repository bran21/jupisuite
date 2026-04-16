import { Connection, PublicKey } from "@solana/web3.js";
import { getConnection } from "../solana-client.js";
import { config } from "../config.js";
import axios from "axios";

interface OnChainSignals {
  largeTransactions: number;
  topHolderConcentration: number; // percentage held by top 10
  totalHolders: number;
}

/**
 * Get on-chain signals for a token mint via Helius DAS API.
 */
export async function getOnChainSignals(
  mintAddress: string
): Promise<OnChainSignals> {
  const result: OnChainSignals = {
    largeTransactions: 0,
    topHolderConcentration: 0,
    totalHolders: 0,
  };

  if (!config.heliusApiKey) return result;

  const heliusUrl = `https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`;

  try {
    // Get token largest accounts (top holders)
    const conn = getConnection();
    const mintPk = new PublicKey(mintAddress);

    const largestAccounts = await conn.getTokenLargestAccounts(mintPk);
    const topAccounts = largestAccounts.value.slice(0, 10);

    // Get total supply for concentration calculation
    const supply = await conn.getTokenSupply(mintPk);
    const totalSupply = parseFloat(supply.value.uiAmountString || "0");

    if (totalSupply > 0) {
      const topHeld = topAccounts.reduce(
        (sum, a) => sum + (a.uiAmount || 0),
        0
      );
      result.topHolderConcentration = (topHeld / totalSupply) * 100;
    }

    // Estimate total holders via Helius DAS getTokenAccounts
    try {
      const { data: dasData } = await axios.post(heliusUrl, {
        jsonrpc: "2.0",
        id: "holder-count",
        method: "getTokenAccounts",
        params: {
          mint: mintAddress,
          page: 1,
          limit: 1,
        },
      });
      result.totalHolders = dasData.result?.total || topAccounts.length;
    } catch {
      result.totalHolders = topAccounts.length;
    }

    // Get recent transactions for large transfer detection
    try {
      const { data: txData } = await axios.post(heliusUrl, {
        jsonrpc: "2.0",
        id: "recent-txs",
        method: "getSignaturesForAddress",
        params: [mintAddress, { limit: 50 }],
      });
      result.largeTransactions = (txData.result || []).length;
    } catch {
      // skip
    }
  } catch {
    // Return defaults
  }

  return result;
}
