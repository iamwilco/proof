"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, ConfirmModal } from "@/components/ui";

interface Entity {
  id: string;
  name?: string;
  title?: string;
}

interface Connection {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  connectionType: string;
  evidence: string | null;
  notes: string | null;
  createdAt: Date;
}

interface ConnectionListProps {
  connections: Connection[];
  entities: {
    people: Entity[];
    organizations: Entity[];
    projects: Entity[];
  };
}

const connectionTypeLabels: Record<string, string> = {
  TEAM_MEMBER: "Team Member",
  FOUNDER: "Founder",
  ADVISOR: "Advisor",
  EMPLOYEE: "Employee",
  PARTNER: "Partner",
  CONTRACTOR: "Contractor",
  INVESTOR: "Investor",
  OTHER: "Other",
};

export function ConnectionList({ connections, entities }: ConnectionListProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const getEntityName = (type: string, id: string): string => {
    switch (type) {
      case "PERSON":
        return entities.people.find((e) => e.id === id)?.name || "Unknown Person";
      case "ORGANIZATION":
        return entities.organizations.find((e) => e.id === id)?.name || "Unknown Org";
      case "PROJECT":
        return entities.projects.find((e) => e.id === id)?.title || "Unknown Project";
      default:
        return "Unknown";
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);

    try {
      const response = await fetch(`/api/admin/connections/${deleteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (connections.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 dark:text-slate-400">
        No manual connections created yet
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3 max-h-[500px] overflow-y-auto">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className="rounded-lg border border-slate-200 p-3 dark:border-slate-700"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-900 dark:text-white truncate">
                    {getEntityName(conn.sourceType, conn.sourceId)}
                  </span>
                  <Badge variant="info" size="sm">
                    {connectionTypeLabels[conn.connectionType] || conn.connectionType}
                  </Badge>
                  <span className="font-medium text-slate-900 dark:text-white truncate">
                    {getEntityName(conn.targetType, conn.targetId)}
                  </span>
                </div>
                {conn.notes && (
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                    {conn.notes}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeleteId(conn.id)}
                className="shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                ×
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Connection"
        description="Are you sure you want to delete this connection? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </>
  );
}
