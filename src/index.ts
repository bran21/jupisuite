import readline from "readline";
import { HumanMessage } from "@langchain/core/messages";
import { config, validateConfig } from "./config.js";
import { createAgent } from "./agent.js";
import { getPublicKeyString, getBalance } from "./wallet.js";
import { getConnection } from "./solana-client.js";

const BANNER = `
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║       ▐█  █  ▐█ ▐███▐█ ▐███  █▐█▐█ ▐█  ▐█  █ ▐████ ▐████   ║
║       ▐█  █  ▐█ ▐█  ▐█   █   █     ▐█   █  █  ▐█   ▐█      ║
║  ▐█   ▐█  █  ▐█ ▐███▐█   █   ▐███  ▐█   █  █   █   ▐███    ║
║  ▐█   ▐█  █  ▐█ ▐█      ▐█       █ ▐█   █  █   █   ▐█      ║
║  ▐████▐█  ████  ▐█      ▐█   ████  ▐█▐█ █  █   █   ▐████   ║
║                                                            ║
║  Full-Stack Jupiter AI Agent — Solana Mainnet              ║
║  Swap · Limits · DCA · Lend · Perps · Predictions          ║     
║  + Market Sentiment · Token Investigation                  ║
║                                                            ║
╚══════════════════════════════════════════════════════════ ═╝
`;

async function main() {
  console.log(BANNER);

  // Validate config
  const missing = validateConfig();
  if (missing.length > 0) {
    console.error(
      `❌ Missing environment variables: ${missing.join(", ")}\n` +
      `Copy .env.example to .env and fill in your keys.`
    );
    process.exit(1);
  }

  // Show wallet info
  const pubkey = getPublicKeyString();
  const conn = getConnection();
  let balanceStr = "unknown";
  try {
    const bal = await getBalance(conn);
    balanceStr = `${bal.toFixed(4)} SOL`;
  } catch {
    balanceStr = "could not fetch";
  }

  console.log(`🔑 Wallet: ${pubkey}`);
  console.log(`💰 Balance: ${balanceStr}`);
  console.log(`🌐 Network: Solana Mainnet`);
  const llmLabel = config.aiProvider === "openrouter" ? "OpenRouter (anthropic/claude-sonnet-4)"
    : config.aiProvider === "anthropic" ? "Claude (Anthropic)"
    : "Qwen (Alibaba)";
  console.log(`🤖 LLM: ${llmLabel}`);
  console.log(`\nType your commands in natural language. Type "exit" to quit.\n`);

  // Create agent
  const agent = await createAgent();

  // Interactive loop
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = () => {
    rl.question("JupiSuite > ", async (input) => {
      const trimmed = input.trim();
      if (!trimmed) return prompt();
      if (trimmed.toLowerCase() === "exit" || trimmed.toLowerCase() === "quit") {
        console.log("\n👋 Goodbye!\n");
        rl.close();
        process.exit(0);
      }

      try {
        console.log("\n🔄 Thinking...\n");

        const result = await agent.invoke({
          messages: [new HumanMessage(trimmed)],
        });

        // Extract the final AI message
        const messages = result.messages || [];
        const lastMessage = messages[messages.length - 1];
        const content =
          typeof lastMessage?.content === "string"
            ? lastMessage.content
            : JSON.stringify(lastMessage?.content, null, 2);

        console.log(`\n${content}\n`);
      } catch (err: any) {
        console.error(`\n❌ Error: ${err.message}\n`);
        if (err.response?.data) {
          console.error(`Details: ${JSON.stringify(err.response.data)}\n`);
        }
      }

      prompt();
    });
  };

  prompt();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
