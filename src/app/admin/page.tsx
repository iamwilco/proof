import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const adminLinks = [
  {
    href: "/admin/people",
    title: "People & Organizations",
    description: "Categorize entries as individuals or organizations and link people to their orgs.",
  },
  {
    href: "/admin/connections",
    title: "Connection Management",
    description: "Manually create connections between people, organizations, and projects.",
  },
  {
    href: "/admin/flags",
    title: "Flag Management",
    description: "Review and manage flagged projects and concerns.",
  },
  {
    href: "/admin/accountability",
    title: "Accountability Scores",
    description: "View and manage accountability scores for projects and people.",
  },
  {
    href: "/admin/concerns",
    title: "Concerns",
    description: "Review community-submitted concerns about projects.",
  },
];

export default async function AdminDashboardPage() {
  const session = await getSession();
  const isAdmin = session?.user.role === "ADMIN" || session?.user.role === "MODERATOR";
  if (!isAdmin) {
    redirect("/login?redirect=/admin");
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-1 text-slate-600 dark:text-slate-400">
          Signed in as <span className="font-medium">{session.user.displayName || session.user.email || "Admin"}</span>
          <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            {session.user.role}
          </span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {adminLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
          >
            <h2 className="text-lg font-semibold text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
              {link.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {link.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}
