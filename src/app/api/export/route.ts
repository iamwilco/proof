import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";
  const type = searchParams.get("type") || "projects";
  const fundId = searchParams.get("fund");
  const status = searchParams.get("status");

  try {
    let data: unknown[];

    switch (type) {
      case "projects": {
        const where = fundId ? { fundId } : {};
        data = await prisma.project.findMany({
          where,
          include: {
            fund: { select: { name: true, number: true } },
            projectPeople: {
              include: { person: { select: { name: true, externalId: true } } },
            },
          },
          orderBy: { fundingAmount: "desc" },
        });
        break;
      }

      case "people": {
        data = await prisma.person.findMany({
          select: {
            id: true,
            externalId: true,
            name: true,
            username: true,
            proposalsCount: true,
            fundedProposalsCount: true,
            completedProposalsCount: true,
            totalAmountRequested: true,
            totalAmountAwarded: true,
            totalAmountReceived: true,
          },
          orderBy: { totalAmountAwarded: "desc" },
        });
        break;
      }

      case "funds": {
        data = await prisma.fund.findMany({
          where: { number: { gt: 0 } },
          orderBy: { number: "desc" },
        });
        break;
      }

      case "milestones": {
        const where: Record<string, unknown> = {};
        if (status) {
          where.status = status;
        }
        if (fundId) {
          where.project = { fundId };
        }
        data = await prisma.milestone.findMany({
          where,
          include: {
            project: { select: { id: true, title: true, fundId: true } },
          },
          orderBy: { dueDate: "asc" },
        });
        break;
      }

      case "reports": {
        const where: Record<string, unknown> = {};
        if (status) {
          where.status = status;
        }
        if (fundId) {
          where.project = { fundId };
        }
        data = await prisma.monthlyReport.findMany({
          where,
          include: {
            project: { select: { id: true, title: true, fundId: true } },
          },
          orderBy: [{ year: "desc" }, { month: "desc" }],
        });
        break;
      }

      case "graph": {
        const [projects, people, projectPeople] = await Promise.all([
          prisma.project.findMany({
            where: fundId ? { fundId } : {},
            select: {
              id: true,
              title: true,
              fundId: true,
              status: true,
              fundingAmount: true,
            },
          }),
          prisma.person.findMany({
            select: {
              id: true,
              name: true,
              totalAmountAwarded: true,
              completedProposalsCount: true,
              fundedProposalsCount: true,
            },
          }),
          prisma.projectPerson.findMany({
            where: fundId ? { project: { fundId } } : {},
            select: { projectId: true, personId: true },
          }),
        ]);

        data = [
          {
            nodes: {
              projects: projects.map((p) => ({
                id: p.id,
                label: p.title,
                type: "project",
                funding: Number(p.fundingAmount),
                status: p.status,
              })),
              people: people.map((p) => ({
                id: p.id,
                label: p.name,
                type: "person",
                funding: Number(p.totalAmountAwarded),
                completionRate:
                  p.fundedProposalsCount > 0
                    ? p.completedProposalsCount / p.fundedProposalsCount
                    : 0,
              })),
            },
            edges: projectPeople.map((pp) => ({
              source: pp.projectId,
              target: pp.personId,
              type: "team_member",
            })),
          },
        ];
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown type: ${type}` },
          { status: 400 }
        );
    }

    if (format === "csv") {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${type}-export.csv"`,
        },
      });
    }

    return NextResponse.json({
      type,
      count: data.length,
      exportedAt: new Date().toISOString(),
      data,
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Export failed" },
      { status: 500 }
    );
  }
}

function convertToCSV(data: unknown[]): string {
  if (data.length === 0) return "";

  const flattenObject = (obj: Record<string, unknown>, prefix = ""): Record<string, string> => {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}_${key}` : key;
      if (value && typeof value === "object" && !Array.isArray(value)) {
        Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
      } else if (Array.isArray(value)) {
        result[newKey] = value.map((v) => (typeof v === "object" ? JSON.stringify(v) : v)).join("; ");
      } else {
        result[newKey] = String(value ?? "");
      }
    }
    return result;
  };

  const flatData = data.map((item) => flattenObject(item as Record<string, unknown>));
  const headers = [...new Set(flatData.flatMap((row) => Object.keys(row)))];

  const escapeCSV = (value: string): string => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const rows = [
    headers.join(","),
    ...flatData.map((row) => headers.map((h) => escapeCSV(row[h] || "")).join(",")),
  ];

  return rows.join("\n");
}
