import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_REDIRECT_URI = process.env.NEXTAUTH_URL + "/api/auth/google/callback";

export async function GET() {
  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.redirect(
      new URL("/login?error=google_not_configured", process.env.NEXTAUTH_URL || "http://localhost:3000")
    );
  }

  const state = randomBytes(16).toString("hex");
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "consent",
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 10, // 10 minutes
    path: "/",
  });

  return response;
}
