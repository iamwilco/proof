"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Select, Input, Textarea } from "@/components/ui";

interface Entity {
  id: string;
  name?: string;
  title?: string;
}

interface ConnectionFormProps {
  entities: {
    people: Entity[];
    organizations: Entity[];
    projects: Entity[];
  };
}

const entityTypes = [
  { value: "PERSON", label: "Person" },
  { value: "ORGANIZATION", label: "Organization" },
  { value: "PROJECT", label: "Project" },
];

const connectionTypes = [
  { value: "TEAM_MEMBER", label: "Team Member" },
  { value: "FOUNDER", label: "Founder" },
  { value: "ADVISOR", label: "Advisor" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "PARTNER", label: "Partner" },
  { value: "CONTRACTOR", label: "Contractor" },
  { value: "INVESTOR", label: "Investor" },
  { value: "OTHER", label: "Other" },
];

export function ConnectionForm({ entities }: ConnectionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [sourceType, setSourceType] = useState("PERSON");
  const [sourceId, setSourceId] = useState("");
  const [targetType, setTargetType] = useState("ORGANIZATION");
  const [targetId, setTargetId] = useState("");
  const [connectionType, setConnectionType] = useState("TEAM_MEMBER");
  const [evidence, setEvidence] = useState("");
  const [notes, setNotes] = useState("");

  const getEntityOptions = (type: string) => {
    switch (type) {
      case "PERSON":
        return entities.people.map((e) => ({ value: e.id, label: e.name || "Unknown" }));
      case "ORGANIZATION":
        return entities.organizations.map((e) => ({ value: e.id, label: e.name || "Unknown" }));
      case "PROJECT":
        return entities.projects.map((e) => ({ value: e.id, label: e.title || "Unknown" }));
      default:
        return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/admin/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          sourceId,
          targetType,
          targetId,
          connectionType,
          evidence: evidence || null,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create connection");
      }

      setSuccess(true);
      setSourceId("");
      setTargetId("");
      setEvidence("");
      setNotes("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Source Type"
          options={entityTypes}
          value={sourceType}
          onChange={(e) => {
            setSourceType(e.target.value);
            setSourceId("");
          }}
        />
        <Select
          label="Source Entity"
          options={[{ value: "", label: "Select..." }, ...getEntityOptions(sourceType)]}
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
        />
      </div>

      <Select
        label="Connection Type"
        options={connectionTypes}
        value={connectionType}
        onChange={(e) => setConnectionType(e.target.value)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Target Type"
          options={entityTypes}
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value);
            setTargetId("");
          }}
        />
        <Select
          label="Target Entity"
          options={[{ value: "", label: "Select..." }, ...getEntityOptions(targetType)]}
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
        />
      </div>

      <Input
        label="Evidence URL"
        placeholder="https://..."
        value={evidence}
        onChange={(e) => setEvidence(e.target.value)}
        hint="Optional: Link to evidence supporting this connection"
      />

      <Textarea
        label="Notes"
        placeholder="Additional context..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300">
          Connection created successfully!
        </div>
      )}

      <Button type="submit" isLoading={loading} disabled={!sourceId || !targetId}>
        Create Connection
      </Button>
    </form>
  );
}
