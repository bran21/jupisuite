import { Connection, VersionedTransaction } from "@solana/web3.js";
import { config } from "./config.js";
import { getKeypair } from "./wallet.js";

let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(config.solanaRpcUrl, "confirmed");
  }
  return _connection;
}

/**
 * Sign a base64-encoded transaction and return the signed base64.
 */
export function signBase64Transaction(base64Tx: string): string {
  const txBuf = Buffer.from(base64Tx, "base64");
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([getKeypair()]);
  return Buffer.from(tx.serialize()).toString("base64");
}

/**
 * Simulate a versioned transaction. Returns true if simulation succeeds.
 */
export async function simulateTransaction(
  base64Tx: string
): Promise<{ success: boolean; error?: string; logs?: string[] }> {
  const conn = getConnection();
  const txBuf = Buffer.from(base64Tx, "base64");
  const tx = VersionedTransaction.deserialize(txBuf);

  const result = await conn.simulateTransaction(tx, {
    sigVerify: false,
    replaceRecentBlockhash: true,
  });

  if (result.value.err) {
    return {
      success: false,
      error: JSON.stringify(result.value.err),
      logs: result.value.logs || undefined,
    };
  }

  return { success: true, logs: result.value.logs || undefined };
}
