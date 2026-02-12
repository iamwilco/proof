import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const NONCE_COOKIE = "wallet_nonce";

export async function GET() {
  const nonce = randomUUID();
  const response = NextResponse.json({ nonce });
  response.cookies.set(NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 5,
    path: "/",
  });
  return response;
}
