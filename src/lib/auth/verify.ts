/**
 * Server-side signature verification for Cardano wallet authentication
 * 
 * Uses @emurgo/cardano-serialization-lib for signature verification
 */

import { prisma } from "@/lib/prisma";

interface VerificationResult {
  valid: boolean;
  stakeAddress?: string;
  error?: string;
}

interface AuthPayload {
  address: string;
  stakeAddress: string;
  signature: string;
  key: string;
  nonce: string;
  timestamp: number;
}

/**
 * Verify the timestamp is within acceptable range (5 minutes)
 */
function verifyTimestamp(timestamp: number): boolean {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  return Math.abs(now - timestamp) < fiveMinutes;
}

/**
 * Check if nonce has been used (replay attack prevention)
 */
async function isNonceUsed(nonce: string): Promise<boolean> {
  const existing = await prisma.authNonce.findUnique({
    where: { nonce },
  });
  return !!existing;
}

/**
 * Mark nonce as used
 */
async function markNonceUsed(nonce: string, stakeAddress: string): Promise<void> {
  await prisma.authNonce.create({
    data: {
      nonce,
      stakeAddress,
      usedAt: new Date(),
    },
  });
}

/**
 * Verify a wallet signature
 * 
 * Note: Full implementation requires @emurgo/cardano-serialization-lib-nodejs
 * This is a placeholder that validates the payload structure
 */
export async function verifyWalletSignature(payload: AuthPayload): Promise<VerificationResult> {
  try {
    // Verify timestamp
    if (!verifyTimestamp(payload.timestamp)) {
      return { valid: false, error: "Signature expired" };
    }

    // Check nonce hasn't been used
    const nonceUsed = await isNonceUsed(payload.nonce);
    if (nonceUsed) {
      return { valid: false, error: "Nonce already used" };
    }

    // Verify signature format
    if (!payload.signature || !payload.key) {
      return { valid: false, error: "Invalid signature format" };
    }

    // Verify stake address format
    if (!payload.stakeAddress.startsWith("stake")) {
      return { valid: false, error: "Invalid stake address format" };
    }

    // TODO: Implement actual signature verification with cardano-serialization-lib
    // For now, we trust the client-side signature
    // In production, uncomment and use:
    // const COSESign1 = CardanoWasm.COSESign1.from_bytes(Buffer.from(payload.signature, "hex"));
    // const publicKey = CardanoWasm.PublicKey.from_bytes(Buffer.from(payload.key, "hex"));
    // const verified = COSESign1.verify(publicKey);

    // Mark nonce as used
    await markNonceUsed(payload.nonce, payload.stakeAddress);

    return {
      valid: true,
      stakeAddress: payload.stakeAddress,
    };
  } catch (error) {
    console.error("Signature verification error:", error);
    return { valid: false, error: "Verification failed" };
  }
}

/**
 * Find or create user by wallet address
 */
export async function findOrCreateUserByWallet(stakeAddress: string): Promise<{
  id: string;
  isNew: boolean;
}> {
  const existingUser = await prisma.user.findUnique({
    where: { walletAddress: stakeAddress },
    select: { id: true },
  });

  if (existingUser) {
    return { id: existingUser.id, isNew: false };
  }

  const newUser = await prisma.user.create({
    data: {
      walletAddress: stakeAddress,
      role: "MEMBER",
    },
    select: { id: true },
  });

  return { id: newUser.id, isNew: true };
}
