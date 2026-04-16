import { Connection, PublicKey } from "@solana/web3.js";
import { getConnection, simulateTransaction } from "../solana-client.js";
import { jupApi } from "../tools/jup-client.js";
import { config } from "../config.js";
import { getOnChainSignals } from "../sentiment/on-chain-signals.js";
import axios from "axios";

export interface SecurityCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  details: string;
}

export interface SecurityReport {
  mint: string;
  checks: SecurityCheck[];
  riskScore: number; // 0-100, higher = riskier
  timestamp: string;
}

/**
 * Run a full security audit on a token mint address.
 */
export async function runSecurityCheck(
  mintAddress: string
): Promise<SecurityReport> {
  const checks: SecurityCheck[] = [];
  const conn = getConnection();

  // 1. Mint Authority check
  try {
    const mintPk = new PublicKey(mintAddress);
    const mintInfo = await conn.getParsedAccountInfo(mintPk);
    const parsed = (mintInfo.value?.data as any)?.parsed?.info;

    if (parsed) {
      const mintAuthority = parsed.mintAuthority;
      const freezeAuthority = parsed.freezeAuthority;

      checks.push({
        name: "Mint Authority",
        status: mintAuthority === null ? "pass" : "fail",
        details: mintAuthority
          ? `⚠️ Active: ${mintAuthority} — can print unlimited tokens`
          : "✅ Revoked — supply is fixed",
      });

      checks.push({
        name: "Freeze Authority",
        status: freezeAuthority === null ? "pass" : "fail",
        details: freezeAuthority
          ? `⚠️ Active: ${freezeAuthority} — can freeze token transfers (honeypot risk)`
          : "✅ Revoked — transfers cannot be frozen",
      });
    } else {
      checks.push({
        name: "Mint Info",
        status: "warn",
        details: "Could not parse mint account data",
      });
    }
  } catch (err: any) {
    checks.push({
      name: "Mint Info",
      status: "warn",
      details: `Error fetching mint info: ${err.message}`,
    });
  }

  // 2. Jupiter Verification Status
  try {
    const { data: tokenData } = await jupApi.get("/tokens/v2/search", {
      params: { query: mintAddress },
    });
    const token = (tokenData || [])[0];

    if (token) {
      const verified = token.verified;
      checks.push({
        name: "Jupiter Verification",
        status: verified ? "pass" : "warn",
        details: verified
          ? `✅ Verified on Jupiter — ${token.name} (${token.symbol})`
          : `⚠️ Not verified — ${token.name || "unknown"} (${token.symbol || "?"})`,
      });

      const organicScore = token.organicScore || 0;
      checks.push({
        name: "Organic Score",
        status: organicScore >= 50 ? "pass" : organicScore >= 20 ? "warn" : "fail",
        details: `Score: ${organicScore}/100 ${organicScore < 20 ? "— likely botted activity" : organicScore < 50 ? "— low organic activity" : "— healthy organic activity"}`,
      });
    } else {
      checks.push({
        name: "Jupiter Listing",
        status: "fail",
        details: "❌ Token not found on Jupiter — unlisted or very new",
      });
    }
  } catch {
    checks.push({
      name: "Jupiter Lookup",
      status: "warn",
      details: "Could not query Jupiter Tokens API",
    });
  }

  // 3. Liquidity check (can we get a quote?)
  try {
    const { data: quoteData } = await jupApi.get("/swap/v2/order", {
      params: {
        inputMint: mintAddress,
        outputMint: "So11111111111111111111111111111111111111112", // SOL
        amount: "1000000", // small test amount
        taker: "11111111111111111111111111111111", // dummy
      },
    });

    checks.push({
      name: "Liquidity (Swap Route)",
      status: quoteData.transaction ? "pass" : "warn",
      details: quoteData.transaction
        ? "✅ Swap route exists — token has liquidity"
        : "⚠️ No swap route found",
    });
  } catch {
    checks.push({
      name: "Liquidity (Swap Route)",
      status: "fail",
      details: "❌ No swap route — token may have no liquidity pool or be a honeypot",
    });
  }

  // 4. Top Holder Concentration
  try {
    const signals = await getOnChainSignals(mintAddress);
    checks.push({
      name: "Holder Concentration",
      status:
        signals.topHolderConcentration < 40
          ? "pass"
          : signals.topHolderConcentration < 70
            ? "warn"
            : "fail",
      details: `Top 10 hold ${signals.topHolderConcentration.toFixed(1)}% of supply (${signals.totalHolders} total holders)`,
    });
  } catch {
    checks.push({
      name: "Holder Concentration",
      status: "warn",
      details: "Could not analyze holder distribution",
    });
  }

  // Calculate risk score
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warnCount = checks.filter((c) => c.status === "warn").length;
  const riskScore = Math.min(100, failCount * 25 + warnCount * 10);

  return {
    mint: mintAddress,
    checks,
    riskScore,
    timestamp: new Date().toISOString(),
  };
}
