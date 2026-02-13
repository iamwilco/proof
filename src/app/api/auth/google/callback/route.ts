import { NextRequest, NextResponse } from "next/server";
import { findOrCreateUserByGoogle, createSession } from "@/lib/auth/nextauth";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.NEXTAUTH_URL + "/api/auth/google/callback";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/login?error=google_denied", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=invalid_request", request.url));
  }

  const storedState = request.cookies.get("oauth_state")?.value;
  if (state !== storedState) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      console.error("Token exchange failed:", await tokenResponse.text());
      return NextResponse.redirect(new URL("/login?error=token_exchange", request.url));
    }

    const tokens = await tokenResponse.json();

    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return NextResponse.redirect(new URL("/login?error=userinfo_failed", request.url));
    }

    const profile = await userInfoResponse.json();

    const { id: userId } = await findOrCreateUserByGoogle({
      sub: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    });

    const sessionToken = await createSession(userId);

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
    response.cookies.delete("oauth_state");

    return response;
  } catch (error) {
    console.error("Google auth error:", error);
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }
}
