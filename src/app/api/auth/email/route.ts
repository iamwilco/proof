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

    const magicLink = `${process.env.NEXTAUTH_URL}/api/auth/email/verify?token=${token}`;

    // In production, send email here
    // For now, log the link for testing
    console.log(`Magic link for ${email}: ${magicLink}`);

    // TODO: Integrate with email service (SendGrid, Resend, etc.)
    // await sendMagicLinkEmail(email, magicLink);

    return NextResponse.json({
      success: true,
      message: "Check your email for the sign-in link",
    });
  } catch (error) {
    console.error("Email auth error:", error);
    return NextResponse.json(
      { error: "Failed to send magic link" },
      { status: 500 }
    );
  }
}
