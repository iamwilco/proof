import prisma from "./prisma";
import crypto from "crypto";

export interface WalletClaimRequest {
  address: string;
  userId?: string;
  personId?: string;
  label?: string;
  description?: string;
}

export interface WalletVerification {
  address: string;
  nonce: string;
  signature: string;
  publicKey?: string;
}

// Generate a nonce for wallet verification
export function generateNonce(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Create a message to be signed for wallet ownership verification
export function createSigningMessage(address: string, nonce: string): string {
  return `Sign this message to verify ownership of wallet ${address.slice(0, 12)}...${address.slice(-8)}\n\nNonce: ${nonce}\n\nThis signature does not grant any permissions or authorize any transactions.`;
}

// Request a wallet claim (first step)
export async function requestWalletClaim(
  request: WalletClaimRequest
): Promise<{ nonce: string; message: string }> {
  const nonce = generateNonce();
  const message = createSigningMessage(request.address, nonce);

  // Check if address already exists
  const existing = await prisma.walletAddress.findUnique({
    where: { address: request.address },
  });

  if (existing?.verified) {
    throw new Error("This wallet address has already been claimed and verified");
  }

  // Create or update the wallet record with the nonce
  await prisma.walletAddress.upsert({
    where: { address: request.address },
    create: {
      address: request.address,
      ownerId: request.userId,
      personId: request.personId,
      label: request.label,
      description: request.description,
      signatureNonce: nonce,
      verified: false,
    },
    update: {
      ownerId: request.userId,
      personId: request.personId,
      label: request.label,
      description: request.description,
      signatureNonce: nonce,
    },
  });

  return { nonce, message };
}

// Verify wallet ownership via signature (second step)
export async function verifyWalletOwnership(
  verification: WalletVerification
): Promise<boolean> {
  const wallet = await prisma.walletAddress.findUnique({
    where: { address: verification.address },
  });

  if (!wallet) {
    throw new Error("Wallet claim not found. Request a claim first.");
  }

  if (wallet.verified) {
    return true; // Already verified
  }

  if (wallet.signatureNonce !== verification.nonce) {
    throw new Error("Invalid nonce. The claim may have expired.");
  }

  // In production, verify the signature using Cardano cryptography
  // For now, we simulate verification
  const isValid = await simulateSignatureVerification(
    verification.address,
    verification.nonce,
    verification.signature
  );

  if (!isValid) {
    throw new Error("Invalid signature");
  }

  // Mark as verified
  await prisma.walletAddress.update({
    where: { address: verification.address },
    data: {
      verified: true,
      verifiedAt: new Date(),
      signatureHash: crypto
        .createHash("sha256")
        .update(verification.signature)
        .digest("hex"),
    },
  });

  return true;
}

// Simulate signature verification (replace with actual Cardano verification)
async function simulateSignatureVerification(
  _address: string,
  _nonce: string,
  signature: string
): Promise<boolean> {
  // In production, use @cardano-sdk or similar to verify
  // For demo purposes, accept any non-empty signature
  return signature.length > 0;
}

// Get wallets for a user
export async function getUserWallets(userId: string) {
  return prisma.walletAddress.findMany({
    where: { ownerId: userId },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });
}

// Get wallets for a person
export async function getPersonWallets(personId: string) {
  return prisma.walletAddress.findMany({
    where: { personId, isPublic: true },
    orderBy: [{ isPrimary: "desc" }, { createdAt: "desc" }],
  });
}

// Set primary wallet for a user
export async function setPrimaryWallet(
  userId: string,
  address: string
): Promise<void> {
  // Unset current primary
  await prisma.walletAddress.updateMany({
    where: { ownerId: userId, isPrimary: true },
    data: { isPrimary: false },
  });

  // Set new primary
  await prisma.walletAddress.update({
    where: { address },
    data: { isPrimary: true },
  });
}

// Update wallet metadata
export async function updateWalletMetadata(
  address: string,
  userId: string,
  data: { label?: string; description?: string; isPublic?: boolean }
): Promise<void> {
  const wallet = await prisma.walletAddress.findFirst({
    where: { address, ownerId: userId },
  });

  if (!wallet) {
    throw new Error("Wallet not found or not owned by user");
  }

  await prisma.walletAddress.update({
    where: { address },
    data,
  });
}

// Remove wallet claim
export async function removeWalletClaim(
  address: string,
  userId: string
): Promise<void> {
  const wallet = await prisma.walletAddress.findFirst({
    where: { address, ownerId: userId },
  });

  if (!wallet) {
    throw new Error("Wallet not found or not owned by user");
  }

  await prisma.walletAddress.delete({
    where: { address },
  });
}

// Link wallet to person
export async function linkWalletToPerson(
  address: string,
  personId: string,
  userId: string
): Promise<void> {
  const wallet = await prisma.walletAddress.findFirst({
    where: { address, ownerId: userId, verified: true },
  });

  if (!wallet) {
    throw new Error("Verified wallet not found or not owned by user");
  }

  await prisma.walletAddress.update({
    where: { address },
    data: { personId },
  });
}

// Get transactions for a wallet
export async function getWalletTransactions(address: string) {
  return prisma.fundingTransaction.findMany({
    where: {
      OR: [{ fromAddress: address }, { toAddress: address }],
    },
    orderBy: { txDate: "desc" },
    include: {
      project: {
        select: { id: true, title: true },
      },
    },
  });
}

// Get wallet stats
export async function getWalletStats(address: string) {
  const [received, sent] = await Promise.all([
    prisma.fundingTransaction.aggregate({
      where: { toAddress: address },
      _sum: { amount: true, usdValueAtTime: true },
      _count: true,
    }),
    prisma.fundingTransaction.aggregate({
      where: { fromAddress: address },
      _sum: { amount: true, usdValueAtTime: true },
      _count: true,
    }),
  ]);

  return {
    received: {
      count: received._count,
      totalAda: Number(received._sum.amount || 0),
      totalUsd: Number(received._sum.usdValueAtTime || 0),
    },
    sent: {
      count: sent._count,
      totalAda: Number(sent._sum.amount || 0),
      totalUsd: Number(sent._sum.usdValueAtTime || 0),
    },
  };
}

// Find wallet by address
export async function findWallet(address: string) {
  return prisma.walletAddress.findUnique({
    where: { address },
    include: {
      owner: { select: { id: true, displayName: true } },
      person: { select: { id: true, name: true } },
    },
  });
}

// Get all verified public wallets
export async function getVerifiedPublicWallets() {
  return prisma.walletAddress.findMany({
    where: { verified: true, isPublic: true },
    include: {
      owner: { select: { id: true, displayName: true } },
      person: { select: { id: true, name: true } },
    },
    orderBy: { verifiedAt: "desc" },
  });
}
