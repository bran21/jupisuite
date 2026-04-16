import { SecurityReport } from "./security-checker.js";

export interface GemScore {
  score: number; // 0-100
  verdict: "AVOID" | "WATCHLIST" | "POTENTIAL GEM" | "STRONG GEM";
  breakdown: {
    security: number;
    liquidity: number;
    organic: number;
  };
}

/**
 * Compute a composite GemScore from a SecurityReport.
 * Higher score = better opportunity. Lower score = more dangerous.
 */
export function computeGemScore(report: SecurityReport): GemScore {
  // Invert risk: high risk → low gem score
  const securityScore = 100 - report.riskScore;

  // Extract specific signals from checks
  const liquidityCheck = report.checks.find((c) => c.name.includes("Liquidity"));
  const organicCheck = report.checks.find((c) => c.name.includes("Organic"));
  const holderCheck = report.checks.find((c) => c.name.includes("Holder"));

  const liquidityScore =
    liquidityCheck?.status === "pass" ? 100 : liquidityCheck?.status === "warn" ? 50 : 0;

  const organicScore =
    organicCheck?.status === "pass" ? 100 : organicCheck?.status === "warn" ? 50 : 0;

  // Weighted composite
  const score = Math.round(
    securityScore * 0.5 + liquidityScore * 0.3 + organicScore * 0.2
  );

  let verdict: GemScore["verdict"];
  if (score >= 75) verdict = "STRONG GEM";
  else if (score >= 55) verdict = "POTENTIAL GEM";
  else if (score >= 35) verdict = "WATCHLIST";
  else verdict = "AVOID";

  return {
    score,
    verdict,
    breakdown: {
      security: securityScore,
      liquidity: liquidityScore,
      organic: organicScore,
    },
  };
}

/**
 * Format a GemScore + SecurityReport for human/agent readability.
 */
export function formatGemReport(
  report: SecurityReport,
  gemScore: GemScore
): string {
  const verdictEmoji: Record<string, string> = {
    "STRONG GEM": "💎",
    "POTENTIAL GEM": "🔍",
    WATCHLIST: "👀",
    AVOID: "🚫",
  };

  let output = `\n${"=".repeat(50)}\n`;
  output += `${verdictEmoji[gemScore.verdict]} TOKEN INVESTIGATION REPORT\n`;
  output += `${"=".repeat(50)}\n`;
  output += `Mint: ${report.mint}\n`;
  output += `GemScore: ${gemScore.score}/100 — ${gemScore.verdict}\n`;
  output += `Risk Score: ${report.riskScore}/100\n\n`;

  output += `Breakdown:\n`;
  output += `  Security: ${gemScore.breakdown.security}/100\n`;
  output += `  Liquidity: ${gemScore.breakdown.liquidity}/100\n`;
  output += `  Organic: ${gemScore.breakdown.organic}/100\n\n`;

  output += `Security Checks:\n`;
  for (const check of report.checks) {
    const icon = check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
    output += `  ${icon} ${check.name}: ${check.details}\n`;
  }
  output += `${"=".repeat(50)}\n`;

  return output;
}
