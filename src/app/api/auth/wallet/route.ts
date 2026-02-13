import { NextRequest, NextResponse } from "next/server";
import { verifyWalletSignature, findOrCreateUserByWallet } from "@/lib/auth/verify";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, stakeAddress, signature, key, nonce, timestamp } = body;

    if (!address || !stakeAddress || !signature || !key || !nonce || !timestamp) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const verification = await verifyWalletSignature({
      address,
      stakeAddress,
      signature,
      key,
      nonce,
      timestamp,
    });

    if (!verification.valid) {
      return NextResponse.json(
        { error: verification.error || "Verification failed" },
        { status: 401 }
      );
    }

    const { id: userId, isNew } = await findOrCreateUserByWallet(stakeAddress);

    const sessionToken = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId,
        token: sessionToken,
        expiresAt,
      },
    });

    const response = NextResponse.json({
      success: true,
      userId,
      stakeAddress,
      isNew,
    });

    response.cookies.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Wallet auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
