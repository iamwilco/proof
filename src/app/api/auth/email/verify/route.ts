import { NextRequest, NextResponse } from "next/server";
import { verifyMagicLinkToken, findOrCreateUserByEmail, createSession } from "@/lib/auth/nextauth";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=missing_token", request.url));
  }

  try {
    const email = await verifyMagicLinkToken(token);

    if (!email) {
      return NextResponse.redirect(new URL("/login?error=invalid_token", request.url));
    }

    const { id: userId } = await findOrCreateUserByEmail(email);
    const sessionToken = await createSession(userId);

    const response = NextResponse.redirect(new URL("/", request.url));
    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Email verify error:", error);
    return NextResponse.redirect(new URL("/login?error=verification_failed", request.url));
  }
}
