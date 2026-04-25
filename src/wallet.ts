import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import bs58 from "bs58";
import nacl from "tweetnacl";
import { config } from "./config.js";

let _keypair: Keypair | null = null;

export function getKeypair(): Keypair {
  if (!_keypair) {
    if (!config.walletPrivateKey) {
      throw new Error("WALLET_PRIVATE_KEY not set in .env");
    }
    const secretKey = bs58.decode(config.walletPrivateKey);
    _keypair = Keypair.fromSecretKey(secretKey);
  }
  return _keypair;
}

export function getPublicKey(): PublicKey {
  return getKeypair().publicKey;
}

export function getPublicKeyString(): string {
  return getPublicKey().toBase58();
}

export function signMessage(message: Uint8Array): Uint8Array {
  const kp = getKeypair();
  return nacl.sign.detached(message, kp.secretKey);
}

export async function getBalance(connection: Connection, owner: PublicKey = getPublicKey()): Promise<number> {
  const balance = await connection.getBalance(owner);
  return balance / LAMPORTS_PER_SOL;
}

export async function getTokenBalances(
  connection: Connection,
  owner: PublicKey = getPublicKey()
): Promise<
  Array<{ mint: string; amount: number; decimals: number; uiAmount: number }>
> {
  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
    owner,
    { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") }
  );

  return tokenAccounts.value.map((ta) => {
    const info = ta.account.data.parsed.info;
    return {
      mint: info.mint,
      amount: parseInt(info.tokenAmount.amount),
      decimals: info.tokenAmount.decimals,
      uiAmount: info.tokenAmount.uiAmount || 0,
    };
  });
}
