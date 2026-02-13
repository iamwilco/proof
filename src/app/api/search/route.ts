import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const searchTerm = `%${query}%`;

    const [projects, people, organizations, funds] = await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: { id: true, title: true, category: true },
        take: 5,
      }),
      prisma.person.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true },
        take: 5,
      }),
      prisma.organization.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true },
        take: 5,
      }),
      prisma.fund.findMany({
        where: {
          name: { contains: query, mode: "insensitive" },
        },
        select: { id: true, name: true, number: true },
        take: 3,
      }),
    ]);

    const results = [
      ...projects.map(p => ({
        id: p.id,
        type: "project" as const,
        title: p.title,
        subtitle: p.category,
        href: `/projects/${p.id}`,
      })),
      ...people.map(p => ({
        id: p.id,
        type: "person" as const,
        title: p.name,
        href: `/people/${p.id}`,
      })),
      ...organizations.map(o => ({
        id: o.id,
        type: "organization" as const,
        title: o.name,
        href: `/organizations/${o.id}`,
      })),
      ...funds.map(f => ({
        id: f.id,
        type: "fund" as const,
        title: f.name,
        subtitle: `Fund ${f.number}`,
        href: `/funds/${f.id}`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
