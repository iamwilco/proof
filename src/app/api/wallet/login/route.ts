import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import prisma from "../../../../lib/prisma";

const NONCE_COOKIE = "wallet_nonce";
const SESSION_COOKIE = "wallet_session";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | { address?: string; signature?: string; key?: string; nonce?: string }
    | null;

  if (!payload?.address || !payload.nonce || !payload.signature || !payload.key) {
    return NextResponse.json({ message: "Invalid wallet login payload." }, { status: 400 });
  }

  const cookieNonce = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${NONCE_COOKIE}=`))
    ?.split("=")[1];

  if (!cookieNonce || cookieNonce !== payload.nonce) {
    return NextResponse.json({ message: "Nonce mismatch. Please retry login." }, { status: 401 });
  }

  // TODO: verify CIP-30 signature against payload.nonce and payload.address.
  const user = await prisma.user.upsert({
    where: { walletAddress: payload.address },
    update: {},
    create: { walletAddress: payload.address },
  });

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

  await prisma.session.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  response.cookies.delete(NONCE_COOKIE);

  return response;
}
