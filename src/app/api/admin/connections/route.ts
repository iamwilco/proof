import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const connections = await prisma.adminConnection.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error("Error fetching connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceType, sourceId, targetType, targetId, connectionType, evidence, notes } = body;

    if (!sourceType || !sourceId || !targetType || !targetId || !connectionType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingConnection = await prisma.adminConnection.findUnique({
      where: {
        sourceType_sourceId_targetType_targetId_connectionType: {
          sourceType,
          sourceId,
          targetType,
          targetId,
          connectionType,
        },
      },
    });

    if (existingConnection) {
      return NextResponse.json(
        { error: "This connection already exists" },
        { status: 409 }
      );
    }

    const connection = await prisma.adminConnection.create({
      data: {
        sourceType,
        sourceId,
        targetType,
        targetId,
        connectionType,
        evidence,
        notes,
        createdById: "system",
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    console.error("Error creating connection:", error);
    return NextResponse.json(
      { error: "Failed to create connection" },
      { status: 500 }
    );
  }
}
