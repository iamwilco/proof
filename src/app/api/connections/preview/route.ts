import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type EntityType = "person" | "organization" | "project";

type GraphNode = {
  data: {
    id: string;
    label: string;
    type: EntityType;
  };
};

type GraphEdge = {
  data: {
    id: string;
    source: string;
    target: string;
    type: string;
  };
};

type ConnectionSummary = {
  id: string;
  type: EntityType;
  label: string;
  connectionType?: string;
  source: "admin" | "inferred";
};

const formatEntityNodeId = (type: EntityType, id: string) => `${type}-${id}`;

const dedupeBy = <T,>(items: T[], getKey: (item: T) => string): T[] => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("type") as EntityType | null;
  const entityId = searchParams.get("id");

  if (!entityType || !entityId) {
    return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
  }

  try {
    const baseConnections = await prisma.adminConnection.findMany({
      where: {
        OR: [
          { sourceType: entityType.toUpperCase() as "PERSON" | "ORGANIZATION" | "PROJECT", sourceId: entityId },
          { targetType: entityType.toUpperCase() as "PERSON" | "ORGANIZATION" | "PROJECT", targetId: entityId },
        ],
      },
      take: 12,
      orderBy: { createdAt: "desc" },
    });

    const adminTargets = baseConnections.map((connection) => {
      const isSource = connection.sourceId === entityId && connection.sourceType.toLowerCase() === entityType;
      const targetType = (isSource ? connection.targetType : connection.sourceType).toLowerCase() as EntityType;
      const targetId = isSource ? connection.targetId : connection.sourceId;
      return { targetType, targetId, connectionType: connection.connectionType };
    });

    const adminPeopleIds = adminTargets.filter((t) => t.targetType === "person").map((t) => t.targetId);
    const adminOrgIds = adminTargets.filter((t) => t.targetType === "organization").map((t) => t.targetId);
    const adminProjectIds = adminTargets.filter((t) => t.targetType === "project").map((t) => t.targetId);

    const [adminPeople, adminOrgs, adminProjects] = await Promise.all([
      adminPeopleIds.length
        ? prisma.person.findMany({
            where: { id: { in: adminPeopleIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      adminOrgIds.length
        ? prisma.organization.findMany({
            where: { id: { in: adminOrgIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
      adminProjectIds.length
        ? prisma.project.findMany({
            where: { id: { in: adminProjectIds } },
            select: { id: true, title: true },
          })
        : Promise.resolve([]),
    ]);

    const adminConnectionMap = new Map<string, ConnectionSummary>();
    adminTargets.forEach((target) => {
      const label =
        target.targetType === "person"
          ? adminPeople.find((person) => person.id === target.targetId)?.name
          : target.targetType === "organization"
            ? adminOrgs.find((org) => org.id === target.targetId)?.name
            : adminProjects.find((project) => project.id === target.targetId)?.title;
      if (!label) return;
      adminConnectionMap.set(`${target.targetType}-${target.targetId}`, {
        id: target.targetId,
        type: target.targetType,
        label,
        connectionType: target.connectionType,
        source: "admin",
      });
    });

    if (entityType === "person") {
      const person = await prisma.person.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          name: true,
          totalAmountAwarded: true,
          proposalsCount: true,
          fundedProposalsCount: true,
          completedProposalsCount: true,
          accountabilityScore: { select: { overallScore: true, badge: true } },
        },
      });

      if (!person) {
        return NextResponse.json({ error: "Person not found" }, { status: 404 });
      }

      const [projects, organizations] = await Promise.all([
        prisma.project.findMany({
          where: { projectPeople: { some: { personId: entityId } } },
          select: { id: true, title: true, fundingAmount: true, fund: { select: { name: true } } },
          orderBy: { fundingAmount: "desc" },
          take: 5,
        }),
        prisma.organization.findMany({
          where: { members: { some: { personId: entityId } } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
          take: 5,
        }),
      ]);

      const inferredConnections: ConnectionSummary[] = [
        ...projects.map((project) => ({
          id: project.id,
          type: "project" as const,
          label: project.title,
          source: "inferred" as const,
        })),
        ...organizations.map((org) => ({
          id: org.id,
          type: "organization" as const,
          label: org.name,
          source: "inferred" as const,
        })),
      ];

      const connections = dedupeBy(
        [...Array.from(adminConnectionMap.values()), ...inferredConnections],
        (item) => `${item.type}-${item.id}`
      ).slice(0, 8);

      const graphNodes: GraphNode[] = [
        { data: { id: formatEntityNodeId("person", person.id), label: person.name, type: "person" } },
        ...connections.map((conn) => ({
          data: { id: formatEntityNodeId(conn.type, conn.id), label: conn.label, type: conn.type },
        })),
      ];

      const graphEdges: GraphEdge[] = connections.map((conn) => ({
        data: {
          id: `${formatEntityNodeId("person", person.id)}-${formatEntityNodeId(conn.type, conn.id)}`,
          source: formatEntityNodeId("person", person.id),
          target: formatEntityNodeId(conn.type, conn.id),
          type: conn.connectionType ?? "linked",
        },
      }));

      return NextResponse.json({
        entity: {
          id: person.id,
          type: "person",
          name: person.name,
          stats: {
            projects: person.proposalsCount,
            funding: Number(person.totalAmountAwarded),
            score: person.accountabilityScore?.overallScore ?? null,
          },
        },
        connections,
        sharedProjects: projects.map((project) => ({
          id: project.id,
          title: project.title,
          fundName: project.fund?.name ?? "",
          fundingAmount: Number(project.fundingAmount),
        })),
        graph: { nodes: graphNodes, edges: graphEdges },
      });
    }

    if (entityType === "organization") {
      const organization = await prisma.organization.findUnique({
        where: { id: entityId },
        select: {
          id: true,
          name: true,
          totalAmountAwarded: true,
          fundedProposalsCount: true,
          completedProposalsCount: true,
          members: { select: { personId: true } },
        },
      });

      if (!organization) {
        return NextResponse.json({ error: "Organization not found" }, { status: 404 });
      }

      const projects = await prisma.project.findMany({
        where: { projectOrgs: { some: { organizationId: entityId } } },
        select: { id: true, title: true, fundingAmount: true, fund: { select: { name: true } } },
        orderBy: { fundingAmount: "desc" },
        take: 5,
      });

      const members = await prisma.person.findMany({
        where: { id: { in: organization.members.map((member) => member.personId) } },
        select: { id: true, name: true },
        take: 5,
      });

      const inferredConnections: ConnectionSummary[] = [
        ...projects.map((project) => ({
          id: project.id,
          type: "project" as const,
          label: project.title,
          source: "inferred" as const,
        })),
        ...members.map((person) => ({
          id: person.id,
          type: "person" as const,
          label: person.name,
          source: "inferred" as const,
        })),
      ];

      const connections = dedupeBy(
        [...Array.from(adminConnectionMap.values()), ...inferredConnections],
        (item) => `${item.type}-${item.id}`
      ).slice(0, 8);

      const graphNodes: GraphNode[] = [
        { data: { id: formatEntityNodeId("organization", organization.id), label: organization.name, type: "organization" } },
        ...connections.map((conn) => ({
          data: { id: formatEntityNodeId(conn.type, conn.id), label: conn.label, type: conn.type },
        })),
      ];

      const graphEdges: GraphEdge[] = connections.map((conn) => ({
        data: {
          id: `${formatEntityNodeId("organization", organization.id)}-${formatEntityNodeId(conn.type, conn.id)}`,
          source: formatEntityNodeId("organization", organization.id),
          target: formatEntityNodeId(conn.type, conn.id),
          type: conn.connectionType ?? "linked",
        },
      }));

      return NextResponse.json({
        entity: {
          id: organization.id,
          type: "organization",
          name: organization.name,
          stats: {
            projects: organization.fundedProposalsCount,
            funding: Number(organization.totalAmountAwarded),
            score: null,
          },
        },
        connections,
        sharedProjects: projects.map((project) => ({
          id: project.id,
          title: project.title,
          fundName: project.fund?.name ?? "",
          fundingAmount: Number(project.fundingAmount),
        })),
        graph: { nodes: graphNodes, edges: graphEdges },
      });
    }

    const project = await prisma.project.findUnique({
      where: { id: entityId },
      select: {
        id: true,
        title: true,
        fundingAmount: true,
        fund: { select: { name: true } },
        projectPeople: { select: { personId: true } },
        projectOrgs: { select: { organizationId: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const personIds = project.projectPeople.map((pp) => pp.personId);
    const organizationIds = project.projectOrgs.map((po) => po.organizationId);

    const [people, organizations, sharedProjects] = await Promise.all([
      personIds.length
        ? prisma.person.findMany({
            where: { id: { in: personIds } },
            select: { id: true, name: true },
            take: 5,
          })
        : Promise.resolve([]),
      organizationIds.length
        ? prisma.organization.findMany({
            where: { id: { in: organizationIds } },
            select: { id: true, name: true },
            take: 5,
          })
        : Promise.resolve([]),
      prisma.project.findMany({
        where: {
          id: { not: project.id },
          OR: [
            personIds.length ? { projectPeople: { some: { personId: { in: personIds } } } } : undefined,
            organizationIds.length ? { projectOrgs: { some: { organizationId: { in: organizationIds } } } } : undefined,
          ].filter(Boolean) as Array<Record<string, unknown>>,
        },
        select: { id: true, title: true, fundingAmount: true, fund: { select: { name: true } } },
        orderBy: { fundingAmount: "desc" },
        take: 5,
      }),
    ]);

    const inferredConnections: ConnectionSummary[] = [
      ...people.map((person) => ({
        id: person.id,
        type: "person" as const,
        label: person.name,
        source: "inferred" as const,
      })),
      ...organizations.map((org) => ({
        id: org.id,
        type: "organization" as const,
        label: org.name,
        source: "inferred" as const,
      })),
    ];

    const connections = dedupeBy(
      [...Array.from(adminConnectionMap.values()), ...inferredConnections],
      (item) => `${item.type}-${item.id}`
    ).slice(0, 8);

    const graphNodes: GraphNode[] = [
      { data: { id: formatEntityNodeId("project", project.id), label: project.title, type: "project" } },
      ...connections.map((conn) => ({
        data: { id: formatEntityNodeId(conn.type, conn.id), label: conn.label, type: conn.type },
      })),
    ];

    const graphEdges: GraphEdge[] = connections.map((conn) => ({
      data: {
        id: `${formatEntityNodeId("project", project.id)}-${formatEntityNodeId(conn.type, conn.id)}`,
        source: formatEntityNodeId("project", project.id),
        target: formatEntityNodeId(conn.type, conn.id),
        type: conn.connectionType ?? "linked",
      },
    }));

    return NextResponse.json({
      entity: {
        id: project.id,
        type: "project",
        name: project.title,
        stats: {
          projects: null,
          funding: Number(project.fundingAmount),
          score: null,
        },
      },
      connections,
      sharedProjects: sharedProjects.map((item) => ({
        id: item.id,
        title: item.title,
        fundName: item.fund?.name ?? "",
        fundingAmount: Number(item.fundingAmount),
      })),
      graph: { nodes: graphNodes, edges: graphEdges },
    });
  } catch (error) {
    console.error("Error fetching hover card data", error);
    return NextResponse.json({ error: "Failed to fetch connections" }, { status: 500 });
  }
}
