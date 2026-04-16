import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { execSync } from "child_process";
import { config } from "../config.js";

/**
 * Execute Jupiter CLI commands with dry-run safety.
 * The CLI is JSON-native and non-interactive.
 */
function runJupCli(command: string, dryRun: boolean): string {
  const fullCmd = dryRun ? `jup ${command} --dry-run -f json` : `jup ${command} -f json`;
  try {
    const output = execSync(fullCmd, {
      encoding: "utf-8",
      timeout: 30000,
      env: { ...process.env, PATH: process.env.PATH },
    });
    return output.trim();
  } catch (err: any) {
    return `CLI Error: ${err.stderr || err.message}`;
  }
}

/**
 * Jupiter Perps — Leveraged perpetual trading via Jupiter CLI.
 * CLI commands: jup perps open/close/positions
 */
export const perpsTool = tool(
  async (input) => {
    try {
      switch (input.action) {
        case "open": {
          const leverage = Math.min(input.leverage || 2, config.risk.maxLeveragePerps);
          const cmd = `perps open --asset ${input.asset} --side ${input.side} --amount ${input.amount} --input ${input.inputToken || "USDC"} --leverage ${leverage}`;

          if (input.dryRun) {
            const preview = runJupCli(cmd, true);
            return `🔍 DRY RUN — Perps Preview:\n${preview}\n\nTo execute, run again with dryRun=false.`;
          }

          const result = runJupCli(cmd, false);
          return `✅ Perps position opened!\n${result}`;
        }

        case "close": {
          const cmd = `perps close --asset ${input.asset} --side ${input.side}`;

          if (input.dryRun) {
            const preview = runJupCli(cmd, true);
            return `🔍 DRY RUN — Close Preview:\n${preview}`;
          }

          const result = runJupCli(cmd, false);
          return `✅ Position closed!\n${result}`;
        }

        case "positions": {
          const result = runJupCli("perps positions", false);
          return `Your Perps Positions:\n${result}`;
        }

        default:
          return `Unknown action: ${input.action}`;
      }
    } catch (err: any) {
      return `Perps error: ${err.message}`;
    }
  },
  {
    name: "jupiter_perps",
    description: `Trade leveraged perpetuals on Jupiter (SOL, ETH, BTC). Uses the Jupiter CLI for execution. Leverage is capped at ${config.risk.maxLeveragePerps}x for safety. ALWAYS use dryRun=true first to preview.`,
    schema: z.object({
      action: z.enum(["open", "close", "positions"]).describe("open: new position. close: close a position. positions: list all."),
      asset: z.string().optional().describe("Trading asset: SOL, ETH, or BTC"),
      side: z.enum(["long", "short"]).optional().describe("Long or short"),
      amount: z.number().optional().describe("Amount in the input token (e.g. 10 USDC)"),
      inputToken: z.string().optional().default("USDC").describe("Collateral token (usually USDC)"),
      leverage: z.number().optional().default(2).describe(`Leverage multiplier (max ${config.risk.maxLeveragePerps}x)`),
      dryRun: z.boolean().default(true).describe("Preview without executing. ALWAYS start with true."),
    }),
  }
);
