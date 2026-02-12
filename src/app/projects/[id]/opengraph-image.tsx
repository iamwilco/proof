import { ImageResponse } from "next/og";

import prisma from "../../../lib/prisma";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      fund: true,
      milestones: {
        select: { status: true },
      },
      _count: {
        select: { projectPeople: true },
      },
    },
  });

  if (!project) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            fontSize: 48,
          }}
        >
          Project not found
        </div>
      ),
      { width: size.width, height: size.height }
    );
  }

  const totalMilestones = project.milestones.length;
  const completedMilestones = project.milestones.filter(
    (milestone) => milestone.status === "completed"
  ).length;
  const completionRate =
    totalMilestones > 0
      ? Math.round((completedMilestones / totalMilestones) * 100)
      : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0f172a",
          color: "#f8fafc",
          padding: "64px",
          fontFamily: "Inter, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              padding: "8px 16px",
              borderRadius: "999px",
              backgroundColor: "rgba(148, 163, 184, 0.2)",
              fontSize: 18,
              textTransform: "uppercase",
              letterSpacing: "0.2em",
            }}
          >
            {project.fund.name}
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.1,
            }}
          >
            {project.title}
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#cbd5f5",
              maxWidth: "920px",
            }}
          >
            {project.description}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "24px",
            borderRadius: "24px",
            backgroundColor: "#111827",
            border: "1px solid rgba(148, 163, 184, 0.3)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              style={{
                fontSize: 16,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
              }}
            >
              Funding
            </span>
            <span style={{ fontSize: 30, fontWeight: 700 }}>
              {formatCurrency(Number(project.fundingAmount))}
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              style={{
                fontSize: 16,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
              }}
            >
              Completion
            </span>
            <span style={{ fontSize: 30, fontWeight: 700 }}>{completionRate}%</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              style={{
                fontSize: 16,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
              }}
            >
              Team
            </span>
            <span style={{ fontSize: 30, fontWeight: 700 }}>
              {project._count.projectPeople}
            </span>
          </div>
        </div>
      </div>
    ),
    { width: size.width, height: size.height }
  );
}
