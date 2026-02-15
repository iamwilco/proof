import { NextRequest, NextResponse } from "next/server";

import prisma from "../../../lib/prisma";

type GraphNode = {
  data: {
    id: string;
    label: string;
    type: "project" | "person" | "fund";
    funding?: number;
    status?: string;
    completionRate?: number;
  };
};

type GraphEdge = {
  data: {
    id: string;
    source: string;
    target: string;
    type: "fund_project" | "project_person";
    funding?: number;
    fundingLabel?: string;
  };
};

const formatFundingLabel = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fundId = searchParams.get("fund");
  const limit = parseInt(searchParams.get("limit") || "200", 10);

  // Build where clause for filtering
  const projectWhere = fundId ? { fundId } : {};

  const [projects, funds, projectPeople] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      select: { 
        id: true, 
        title: true, 
        fundId: true, 
        status: true,
        fundingAmount: true,
      },
      take: limit,
      orderBy: { fundingAmount: "desc" },
    }),
    prisma.fund.findMany({
      where: fundId ? { id: fundId } : { number: { gt: 0 } },
      select: { 
        id: true, 
        name: true,
        totalAwarded: true,
        completedProposalsCount: true,
        fundedProposalsCount: true,
      },
    }),
    prisma.projectPerson.findMany({
      where: fundId ? { project: { fundId } } : {},
      select: { id: true, projectId: true, personId: true },
      take: limit * 3,
    }),
  ]);

  // Get unique person IDs from project-person links
  const personIds = [...new Set(projectPeople.map(pp => pp.personId))];
  
  const people = await prisma.person.findMany({
    where: { id: { in: personIds } },
    select: { 
      id: true, 
      name: true,
      totalAmountAwarded: true,
      completedProposalsCount: true,
      fundedProposalsCount: true,
    },
  });

  // Filter to only include projects that exist in our result set
  const projectIds = new Set(projects.map(p => p.id));
  const filteredProjectPeople = projectPeople.filter(pp => projectIds.has(pp.projectId));

  const nodes: GraphNode[] = [
    ...projects.map(
      (project): GraphNode => ({
        data: { 
          id: `project-${project.id}`, 
          label: project.title.length > 30 ? project.title.slice(0, 30) + "…" : project.title, 
          type: "project",
          funding: Number(project.fundingAmount),
          status: project.status,
        },
      })
    ),
    ...people.map(
      (person): GraphNode => ({
        data: { 
          id: `person-${person.id}`, 
          label: person.name, 
          type: "person",
          funding: Number(person.totalAmountAwarded),
          completionRate: person.fundedProposalsCount > 0 
            ? person.completedProposalsCount / person.fundedProposalsCount 
            : 0,
        },
      })
    ),
    ...funds.map(
      (fund): GraphNode => ({
        data: { 
          id: `fund-${fund.id}`, 
          label: fund.name, 
          type: "fund",
          funding: Number(fund.totalAwarded),
          completionRate: fund.fundedProposalsCount > 0 
            ? fund.completedProposalsCount / fund.fundedProposalsCount 
            : 0,
        },
      })
    ),
  ];

  const edges: GraphEdge[] = [
    ...projects.map(
      (project): GraphEdge => {
        const funding = Number(project.fundingAmount);
        return {
          data: {
            id: `fund-${project.fundId}-project-${project.id}`,
            source: `fund-${project.fundId}`,
            target: `project-${project.id}`,
            type: "fund_project",
            funding,
            fundingLabel: formatFundingLabel(funding),
          },
        };
      }
    ),
    ...filteredProjectPeople.map(
      (pp): GraphEdge => ({
        data: {
          id: `project-${pp.projectId}-person-${pp.personId}`,
          source: `project-${pp.projectId}`,
          target: `person-${pp.personId}`,
          type: "project_person",
        },
      })
    ),
  ];

  return NextResponse.json({ 
    nodes, 
    edges,
    stats: {
      projects: projects.length,
      people: people.length,
      funds: funds.length,
      links: filteredProjectPeople.length,
    }
  });
}
