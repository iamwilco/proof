import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const roiScores = await prisma.projectROI.findMany({
    orderBy: { calculatedAt: "desc" },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          fundingAmount: true,
          fund: { select: { name: true } },
        },
      },
    },
  });

  // Deduplicate to get latest ROI per project
  const latestByProject = new Map<string, typeof roiScores[0]>();
  for (const roi of roiScores) {
    if (!latestByProject.has(roi.projectId)) {
      latestByProject.set(roi.projectId, roi);
    }
  }
  const uniqueROIs = Array.from(latestByProject.values());

  // Build CSV
  const headers = [
    "Project ID",
    "Project Title",
    "Fund",
    "Category",
    "Status",
    "Funding Amount (USD)",
    "GitHub Score",
    "Deliverable Score",
    "On-Chain Score",
    "Outcome Score",
    "ROI Score",
    "Category Percentile",
    "Overall Percentile",
    "Calculated At",
  ];

  const rows = uniqueROIs.map((roi) => [
    roi.projectId,
    `"${roi.project.title.replace(/"/g, '""')}"`,
    `"${roi.project.fund.name.replace(/"/g, '""')}"`,
    roi.project.category,
    roi.project.status,
    Number(roi.fundingAmount).toFixed(2),
    roi.githubScore.toFixed(2),
    roi.deliverableScore.toFixed(2),
    roi.onchainScore.toFixed(2),
    roi.outcomeScore.toFixed(2),
    roi.roiScore.toFixed(2),
    roi.categoryPercentile?.toFixed(2) ?? "",
    roi.overallPercentile?.toFixed(2) ?? "",
    roi.calculatedAt.toISOString(),
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="roi-export-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
