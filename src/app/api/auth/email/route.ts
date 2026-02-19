import { NextRequest, NextResponse } from "next/server";
import { generateMagicLinkToken, storeMagicLinkToken } from "@/lib/auth/nextauth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required" },
        { status: 400 }
      );
    }

    const token = generateMagicLinkToken();
    await storeMagicLinkToken(email.toLowerCase(), token);

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const magicLink = `${baseUrl}/api/auth/email/verify?token=${token}`;

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // await sendMagicLinkEmail(email, magicLink);
    console.log(`Magic link for ${email}: ${magicLink}`);

    // In development, return the link directly so the user can sign in
    const isDev = process.env.NODE_ENV !== "production";

    return NextResponse.json({
      success: true,
      message: isDev
        ? "Development mode: use the link below to sign in"
        : "Check your email for the sign-in link",
      ...(isDev && { magicLink }),
    });
  } catch (error) {
    console.error("Email auth error:", error);
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    );
  }
}
