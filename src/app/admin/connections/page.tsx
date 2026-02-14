import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui";
import { ConnectionForm } from "./ConnectionForm";
import { ConnectionList } from "./ConnectionList";

export const dynamic = "force-dynamic";

async function getConnections() {
  return prisma.adminConnection.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

async function getEntities() {
  const [people, organizations, projects] = await Promise.all([
    prisma.person.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.organization.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.project.findMany({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
      take: 500,
    }),
  ]);

  return { people, organizations, projects };
}

export default async function AdminConnectionsPage() {
  const session = await getSession();
  const isAdmin = session?.user.role === "ADMIN" || session?.user.role === "MODERATOR";
  if (!isAdmin) {
    redirect("/login?redirect=/admin/connections");
  }

  const [connections, entities] = await Promise.all([
    getConnections(),
    getEntities(),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Connection Management
          </h1>
          <Badge variant="warning">Admin</Badge>
        </div>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manually create connections between people, organizations, and projects when data sources are incomplete.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Create Connection</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectionForm entities={entities} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Recent Connections
              <span className="ml-2 text-sm font-normal text-slate-500">
                ({connections.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectionList connections={connections} entities={entities} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
