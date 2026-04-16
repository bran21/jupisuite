import axios from "axios";
import { config } from "../config.js";
import { jupApi } from "../tools/jup-client.js";

interface PriceMomentumData {
  prices: Array<{
    mint: string;
    symbol?: string;
    priceUsd: number;
    confidence?: string;
  }>;
  trending: Array<{ name: string; symbol: string; mint: string }>;
  recentTokens: Array<{
    name: string;
    symbol: string;
    mint: string;
    organicScore?: number;
  }>;
}

/**
 * Gather price momentum data from Jupiter Price + Tokens APIs.
 */
export async function getPriceMomentum(
  mints: string[] = []
): Promise<PriceMomentumData> {
  const result: PriceMomentumData = { prices: [], trending: [], recentTokens: [] };

  // Major tokens to always check
  const defaultMints = [
    "So11111111111111111111111111111111111111112", // SOL
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC
    "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB", // USDT
    "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN", // JUP
  ];
  const allMints = [...new Set([...defaultMints, ...mints])];

  try {
    // Prices
    const ids = allMints.join(",");
    const { data: priceData } = await jupApi.get("/price/v3", {
      params: { ids },
    });
    const prices = priceData.data || {};
    result.prices = Object.entries(prices).map(([mint, info]: [string, any]) => ({
      mint,
      priceUsd: parseFloat(info.price) || 0,
      confidence: info.confidence,
    }));
  } catch {
    // continue without prices
  }

  try {
    // Trending
    const { data: trendingData } = await jupApi.get("/tokens/v2/content/cooking");
    result.trending = (trendingData || []).slice(0, 10).map((t: any) => ({
      name: t.name,
      symbol: t.symbol,
      mint: t.mint || t.address,
    }));
  } catch {
    // continue
  }

  try {
    // Recent
    const { data: recentData } = await jupApi.get("/tokens/v2/recent");
    result.recentTokens = (recentData || []).slice(0, 10).map((t: any) => ({
      name: t.name,
      symbol: t.symbol,
      mint: t.address,
      organicScore: t.organicScore,
    }));
  } catch {
    // continue
  }

  return result;
}
