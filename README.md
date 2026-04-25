# JupiSuite

**Full-stack Jupiter AI Agent** — AI-powered DeFi copilot for the entire Jupiter ecosystem on Solana.

![JupiSuite Banner](https://img.shields.io/badge/JupiSuite-AI_Copilot-blue) ![Solana](https://img.shields.io/badge/Network-Solana_Mainnet-green)

JupiSuite is a powerful CLI-based AI agent built to interact seamlessly with the Jupiter DeFi ecosystem on Solana. Using natural language, you can perform swaps, execute limit orders, set up DCA (Dollar Cost Averaging) strategies, lend assets, trade perpetuals, predict markets, analyze market sentiment, and investigate tokens. 

It leverages LangChain and connects to leading AI providers (Claude, Qwen) to understand your intent and execute complex DeFi operations autonomously.

## 🌟 Key Features

- **Natural Language DeFi:** Just type what you want to do (e.g., "Swap 0.1 SOL for USDC").
- **Jupiter Integration:** Full support for Swap, Limit Orders, DCA, Perps, and more.
- **Token & Market Analysis:** built-in token hunter and sentiment analysis tools.
- **Multiple AI Providers:** Choose between Alibaba (Qwen) and Anthropic (Claude).
- **Secure Wallet Management:** Local execution ensuring your private keys never leave your machine.

---

## 🚀 Tutorial: Getting Started

Follow these steps to configure and run your JupiSuite agent.

### Prerequisites
- Node.js (v18+)
- A Solana Wallet (Private Key in base58 format)
- Jupiter API Key (from [developers.jup.ag/portal](https://developers.jup.ag/portal))
- Helius API Key (from [helius.dev](https://helius.dev))
- API Key for your chosen LLM (Alibaba or Anthropic)

### 1. Installation

Clone the repository and install dependencies:

```bash
# Install dependencies
npm install
```

### 2. Configuration

Copy the `.env.example` file to create your own `.env` configuration:

```bash
cp .env.example .env
```

Open the `.env` file and fill in the required variables:

- `WALLET_PRIVATE_KEY`: Your Solana wallet's private key (base58 encoded).
- `JUPITER_API_KEY`: Your Jupiter developer API key.
- `HELIUS_API_KEY`: Your Helius API key for RPC access.
- `AI_PROVIDER`: Set to `alibaba` or `anthropic`.
- `ALIBABA_API_KEY` or `ANTHROPIC_API_KEY`: The API key for your chosen AI provider.

### 3. Running the Agent

You can start the JupiSuite agent in development mode using:

```bash
npm run dev
```

If everything is configured correctly, you'll see the JupiSuite banner along with your wallet address, balance, and the active LLM.

### 4. Your First Commands

Once the JupiSuite prompt (`JupiSuite > `) appears, try asking the agent to perform some tasks:

- *"What is my wallet balance?"*
- *"Check the current price of SOL and JUP."*
- *"Swap 0.05 SOL to USDC using Jupiter."*
- *"What is the market sentiment for BONK right now?"*

To exit the agent, simply type `exit` or `quit`.

---

## 🛠️ Development

- `npm run build`: Compile the TypeScript code to JavaScript (`dist/`).
- `npm run start`: Run the compiled production build.
- `npm run test`: Run the test suite via Vitest.
