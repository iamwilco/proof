/**
 * NextAuth.js Configuration
 * 
 * Supports Google OAuth and Email Magic Link providers
 * Wallet auth is handled separately via CIP-30
 */

import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
}


/**
 * Generate a magic link token
 */
export function generateMagicLinkToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Store magic link token in database
 */
export async function storeMagicLinkToken(email: string, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  
  await prisma.magicLinkToken.upsert({
    where: { email },
    update: { token, expiresAt },
    create: { email, token, expiresAt },
  });
}

/**
 * Verify magic link token and return email if valid
 */
export async function verifyMagicLinkToken(token: string): Promise<string | null> {
  const record = await prisma.magicLinkToken.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    return null;
  }

  // Delete the token after use
  await prisma.magicLinkToken.delete({
    where: { token },
  });

  return record.email;
}

/**
 * Find or create user by email
 */
export async function findOrCreateUserByEmail(email: string, name?: string): Promise<{
  id: string;
  isNew: boolean;
}> {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser) {
    return { id: existingUser.id, isNew: false };
  }

  const newUser = await prisma.user.create({
    data: {
      email,
      displayName: name || null,
      role: "MEMBER",
    },
    select: { id: true },
  });

  return { id: newUser.id, isNew: true };
}

/**
 * Find or create user by Google profile
 */
export async function findOrCreateUserByGoogle(profile: GoogleProfile): Promise<{
  id: string;
  isNew: boolean;
}> {
  // First check if user exists by googleId
  const existingByGoogle = await prisma.user.findUnique({
    where: { googleId: profile.sub },
    select: { id: true },
  });

  if (existingByGoogle) {
    return { id: existingByGoogle.id, isNew: false };
  }

  // Check if user exists by email and link Google account
  const existingByEmail = await prisma.user.findUnique({
    where: { email: profile.email },
    select: { id: true },
  });

  if (existingByEmail) {
    await prisma.user.update({
      where: { id: existingByEmail.id },
      data: {
        googleId: profile.sub,
        avatarUrl: profile.picture || undefined,
      },
    });
    return { id: existingByEmail.id, isNew: false };
  }

  // Create new user
  const newUser = await prisma.user.create({
    data: {
      googleId: profile.sub,
      email: profile.email,
      displayName: profile.name || null,
      avatarUrl: profile.picture || null,
      role: "MEMBER",
    },
    select: { id: true },
  });

  return { id: newUser.id, isNew: true };
}

/**
 * Create session for user
 */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}
