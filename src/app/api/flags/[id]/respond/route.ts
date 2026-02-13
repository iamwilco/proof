import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();
  const { response, evidenceUrl } = body;

  if (!response) {
    return NextResponse.json(
      { error: "Response is required" },
      { status: 400 }
    );
  }

  const flag = await prisma.flag.findUnique({
    where: { id },
    include: {
      project: {
        select: { id: true, title: true },
      },
    },
  });

  if (!flag) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }

  if (flag.status !== "pending") {
    return NextResponse.json(
      { error: "Can only respond to pending flags" },
      { status: 400 }
    );
  }

  // Store response in metadata
  const currentMetadata = (flag.metadata as Record<string, unknown>) || {};
  const updatedMetadata = {
    ...currentMetadata,
    proposerResponse: {
      response,
      evidenceUrl,
      respondedAt: new Date().toISOString(),
    },
  };

  const updatedFlag = await prisma.flag.update({
    where: { id },
    data: {
      metadata: updatedMetadata,
    },
  });

  // Notify admins about the response
  const admins = await prisma.user.findMany({
    where: { role: "admin" },
    select: { id: true },
  });

  for (const admin of admins) {
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: "flag_response",
        title: "Proposer responded to flag",
        message: `A proposer has responded to the flag "${flag.title}" on project "${flag.project.title}".`,
        read: false,
      },
    });
  }

  return NextResponse.json(updatedFlag);
}
