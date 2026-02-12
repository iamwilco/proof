import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
  const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);
  const fundFilter = searchParams.get("fund");
  const statusFilter = searchParams.get("status");

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const where: Record<string, unknown> = {
    dueDate: {
      gte: startOfMonth,
      lte: endOfMonth,
    },
  };
  if (statusFilter) {
    where.status = statusFilter;
  }
  if (fundFilter) {
    where.project = { fundId: fundFilter };
  }

  const milestones = await prisma.milestone.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          title: true,
          fund: { select: { name: true } },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const formatDateOnly = (date: Date) => {
    return date.toISOString().split("T")[0].replace(/-/g, "");
  };

  const escapeIcal = (text: string) => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const events = milestones
    .filter((m) => m.dueDate)
    .map((milestone) => {
      const dueDate = milestone.dueDate!;
      const uid = `milestone-${milestone.id}@proof.catalyst`;
      const summary = escapeIcal(`${milestone.title} - ${milestone.project.title}`);
      const description = escapeIcal(
        `Project: ${milestone.project.title}\\nFund: ${milestone.project.fund.name}\\nStatus: ${milestone.status}`
      );
      const url = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/projects/${milestone.project.id}`;

      return [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${formatDate(new Date())}`,
        `DTSTART;VALUE=DATE:${formatDateOnly(dueDate)}`,
        `DTEND;VALUE=DATE:${formatDateOnly(new Date(dueDate.getTime() + 86400000))}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `URL:${url}`,
        `STATUS:${milestone.status === "completed" ? "COMPLETED" : "CONFIRMED"}`,
        "END:VEVENT",
      ].join("\r\n");
    });

  const calendar = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PROOF Catalyst//Milestone Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:Catalyst Milestones - ${month}/${year}`,
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="milestones-${year}-${month}.ics"`,
    },
  });
}
