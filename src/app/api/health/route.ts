import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export const runtime = "nodejs";

interface DataQualityCheck {
  name: string;
  status: "pass" | "warn" | "fail";
  value: number | string;
  threshold?: number | string;
  message?: string;
}

export async function GET() {
  const startedAt = Date.now();
  const checks: DataQualityCheck[] = [];
  let overallStatus: "ok" | "degraded" | "error" = "ok";

  try {
    // 1. Database connectivity
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = Date.now() - startedAt;
    checks.push({
      name: "database_connectivity",
      status: dbLatencyMs < 500 ? "pass" : dbLatencyMs < 2000 ? "warn" : "fail",
      value: dbLatencyMs,
      threshold: 500,
      message: `Database latency: ${dbLatencyMs}ms`,
    });

    // 2. Data freshness - check last ingestion
    const lastProject = await prisma.project.findFirst({
      orderBy: { lastSeenAt: "desc" },
      select: { lastSeenAt: true },
    });
    const hoursSinceIngestion = lastProject?.lastSeenAt
      ? (Date.now() - lastProject.lastSeenAt.getTime()) / (1000 * 60 * 60)
      : Infinity;
    checks.push({
      name: "data_freshness",
      status: hoursSinceIngestion < 24 ? "pass" : hoursSinceIngestion < 72 ? "warn" : "fail",
      value: Math.round(hoursSinceIngestion),
      threshold: 24,
      message: `Last ingestion: ${Math.round(hoursSinceIngestion)} hours ago`,
    });

    // 3. Project completeness - projects with missing key fields
    const [totalProjects, projectsWithDescription, projectsWithFunding] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { description: { not: "" } } }),
      prisma.project.count({ where: { fundingAmount: { gt: 0 } } }),
    ]);
    const descriptionRate = totalProjects > 0 ? (projectsWithDescription / totalProjects) * 100 : 0;
    const fundingRate = totalProjects > 0 ? (projectsWithFunding / totalProjects) * 100 : 0;
    checks.push({
      name: "project_description_rate",
      status: descriptionRate > 90 ? "pass" : descriptionRate > 70 ? "warn" : "fail",
      value: `${descriptionRate.toFixed(1)}%`,
      threshold: "90%",
      message: `${projectsWithDescription}/${totalProjects} projects have descriptions`,
    });
    checks.push({
      name: "project_funding_rate",
      status: fundingRate > 80 ? "pass" : fundingRate > 50 ? "warn" : "fail",
      value: `${fundingRate.toFixed(1)}%`,
      threshold: "80%",
      message: `${projectsWithFunding}/${totalProjects} projects have funding data`,
    });

    // 4. Person linkage - people linked to projects
    const [totalPeople, linkedPeople] = await Promise.all([
      prisma.person.count(),
      prisma.person.count({ where: { projectPeople: { some: {} } } }),
    ]);
    const linkageRate = totalPeople > 0 ? (linkedPeople / totalPeople) * 100 : 0;
    checks.push({
      name: "person_linkage_rate",
      status: linkageRate > 80 ? "pass" : linkageRate > 50 ? "warn" : "fail",
      value: `${linkageRate.toFixed(1)}%`,
      threshold: "80%",
      message: `${linkedPeople}/${totalPeople} people linked to projects`,
    });

    // 5. Fund coverage - funds with projects
    const [totalFunds, fundsWithProjects] = await Promise.all([
      prisma.fund.count(),
      prisma.fund.count({ where: { projects: { some: {} } } }),
    ]);
    const fundCoverage = totalFunds > 0 ? (fundsWithProjects / totalFunds) * 100 : 0;
    checks.push({
      name: "fund_coverage",
      status: fundCoverage > 90 ? "pass" : fundCoverage > 70 ? "warn" : "fail",
      value: `${fundCoverage.toFixed(1)}%`,
      threshold: "90%",
      message: `${fundsWithProjects}/${totalFunds} funds have projects`,
    });

    // 6. ROI coverage - projects with ROI scores
    const [fundedProjects, projectsWithROI] = await Promise.all([
      prisma.project.count({ where: { fundingStatus: "funded" } }),
      prisma.project.count({ where: { roiScores: { some: {} } } }),
    ]);
    const roiCoverage = fundedProjects > 0 ? (projectsWithROI / fundedProjects) * 100 : 0;
    checks.push({
      name: "roi_coverage",
      status: roiCoverage > 50 ? "pass" : roiCoverage > 20 ? "warn" : "fail",
      value: `${roiCoverage.toFixed(1)}%`,
      threshold: "50%",
      message: `${projectsWithROI}/${fundedProjects} funded projects have ROI scores`,
    });

    // 7. Orphan detection - projects with missing titles (data quality)
    const incompleteProjects = await prisma.project.count({
      where: { OR: [{ title: "" }, { title: { startsWith: "Untitled" } }] },
    });
    checks.push({
      name: "incomplete_projects",
      status: incompleteProjects === 0 ? "pass" : incompleteProjects < 10 ? "warn" : "fail",
      value: incompleteProjects,
      threshold: 0,
      message: `${incompleteProjects} projects with missing/incomplete titles`,
    });

    // Determine overall status
    const hasFailure = checks.some((c) => c.status === "fail");
    const hasWarning = checks.some((c) => c.status === "warn");
    overallStatus = hasFailure ? "error" : hasWarning ? "degraded" : "ok";

    // Summary stats
    const stats = {
      projects: totalProjects,
      people: totalPeople,
      funds: totalFunds,
      fundedProjects,
      roiScored: projectsWithROI,
    };

    return NextResponse.json({
      status: overallStatus,
      checks,
      stats,
      dbLatencyMs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        checks,
        message: error instanceof Error ? error.message : "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
