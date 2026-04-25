import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { Connection, PublicKey, Transaction, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, createTransferInstruction } from "@solana/spl-token";
import { getConnection } from "../solana-client.js";
import { getKeypair } from "../wallet.js";

/**
 * Tool to send standard tokens (SPL or SOL) to an address.
 */
export const sendTool = tool(
  async (input) => {
    try {
      const conn = getConnection();
      const walletKeypair = getKeypair();
      const recipientPubkey = new PublicKey(input.recipientAddress);

      if (input.mint === "So11111111111111111111111111111111111111112" || input.mint === "SOL") {
        // Send native SOL
        const tx = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: walletKeypair.publicKey,
            toPubkey: recipientPubkey,
            lamports: input.amount,
          })
        );
        const signature = await sendAndConfirmTransaction(conn, tx, [walletKeypair]);
        return `✅ Successfully sent SOL! Signature: ${signature}\nView: https://solscan.io/tx/${signature}`;
      } else {
        // Send SPL Token
        const mintPubkey = new PublicKey(input.mint);
        
        // Sender token account
        const senderAta = await getOrCreateAssociatedTokenAccount(
          conn,
          walletKeypair,
          mintPubkey,
          walletKeypair.publicKey
        );

        // Recipient token account
        const recipientAta = await getOrCreateAssociatedTokenAccount(
          conn,
          walletKeypair, // payer
          mintPubkey,
          recipientPubkey
        );

        const tx = new Transaction().add(
          createTransferInstruction(
            senderAta.address,
            recipientAta.address,
            walletKeypair.publicKey,
            input.amount
          )
        );

        const signature = await sendAndConfirmTransaction(conn, tx, [walletKeypair]);
        return `✅ Successfully sent Token! Signature: ${signature}\nView: https://solscan.io/tx/${signature}`;
      }
    } catch (err: any) {
      return `Failed to send token: ${err.message}`;
    }
  },
  {
    name: "send_tokens",
    description:
      "Send SOL or SPL Tokens from the agent's wallet to a recipient address on Solana.",
    schema: z.object({
      recipientAddress: z.string().describe("The base58 recipient public key"),
      mint: z.string().describe("The token mint address (e.g. So11... for SOL)"),
      amount: z.number().describe("The amount to send in the smallest unit (e.g. lamports for SOL)"),
    }),
  }
);
