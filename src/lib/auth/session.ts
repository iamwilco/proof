import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export interface SessionUser {
  id: string;
  walletAddress: string | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: "MEMBER" | "PROPOSER" | "REVIEWER" | "MODERATOR" | "ADMIN";
}

export interface Session {
  user: SessionUser;
  expiresAt: Date;
}

export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { token: sessionToken },
    include: {
      user: {
        select: {
          id: true,
          walletAddress: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          role: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return {
    user: session.user as SessionUser,
    expiresAt: session.expiresAt,
  };
});

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireRole(roles: SessionUser["role"][]): Promise<Session> {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new Error("Forbidden");
  }
  return session;
}

export async function requireAdmin(): Promise<Session> {
  return requireRole(["ADMIN"]);
}

export async function requireModerator(): Promise<Session> {
  return requireRole(["MODERATOR", "ADMIN"]);
}
