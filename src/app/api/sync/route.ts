/**
 * API Route for syncing project data from external Catalyst APIs
 * POST /api/sync - Sync a specific project's data
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { getSession } from "../../../lib/auth/session";
import {
  syncProjectFromExplorer,
  syncMilestonesFromApi,
} from "../../../lib/catalyst-api";

export async function POST(request: NextRequest) {
  // Check authentication - only allow admins/moderators
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check user role from session
  if (!["ADMIN", "MODERATOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { projectId, syncType } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required" },
        { status: 400 }
      );
    }

    // Find the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        externalId: true,
        catalystId: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const results: {
      explorer?: { success: boolean; updated: number; errors: string[] };
      milestones?: { success: boolean; updated: number; errors: string[] };
    } = {};

    // Sync from Catalyst Explorer
    if (syncType === "all" || syncType === "explorer") {
      if (project.externalId) {
        results.explorer = await syncProjectFromExplorer(
          project.externalId,
          prisma
        );
      } else {
        results.explorer = {
          success: false,
          updated: 0,
          errors: ["No external ID available for explorer sync"],
        };
      }
    }

    // Sync milestones
    if (syncType === "all" || syncType === "milestones") {
      const catalystId = project.catalystId || project.externalId;
      if (catalystId) {
        results.milestones = await syncMilestonesFromApi(
          parseInt(catalystId, 10),
          prisma
        );
      } else {
        results.milestones = {
          success: false,
          updated: 0,
          errors: ["No catalyst ID available for milestone sync"],
        };
      }
    }

    return NextResponse.json({
      success: true,
      projectId,
      results,
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to check sync status / get external links
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      externalId: true,
      catalystId: true,
      ideascaleId: true,
      catalystUrl: true,
      milestonesUrl: true,
      explorerUrl: true,
      ideascaleUrl: true,
      lastSeenAt: true,
      milestonesTotal: true,
      milestonesCompleted: true,
      milestonesInProgress: true,
      milestonesPending: true,
      lastMilestoneAt: true,
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    project,
    externalIds: {
      externalId: project.externalId,
      catalystId: project.catalystId,
      ideascaleId: project.ideascaleId,
    },
    urls: {
      catalyst: project.catalystUrl,
      milestones: project.milestonesUrl,
      explorer: project.explorerUrl,
      ideascale: project.ideascaleUrl,
    },
    milestoneStats: {
      total: project.milestonesTotal,
      completed: project.milestonesCompleted,
      inProgress: project.milestonesInProgress,
      pending: project.milestonesPending,
      lastActivity: project.lastMilestoneAt,
    },
    lastSynced: project.lastSeenAt,
  });
}
