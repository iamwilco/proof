"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { ThemeToggle } from "./ui";
import { WalletConnect, useSession } from "./auth";
import { GlobalSearch } from "./search";

const publicNavItems = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/funds", label: "Funds" },
  { href: "/projects", label: "Projects" },
  { href: "/people", label: "People" },
  { href: "/organizations", label: "Organizations" },
];

const analyticsNavItems = [
  { href: "/rankings", label: "Rankings" },
  { href: "/flags", label: "Flags" },
  { href: "/graph", label: "Graph" },
];

const moreNavItems = [
  { href: "/milestones", label: "Milestones" },
  { href: "/reports", label: "Reports" },
  { href: "/voting", label: "Voting" },
  { href: "/communities", label: "Communities" },
  { href: "/roadmap", label: "Roadmap" },
];

const adminNavItems = [
  { href: "/admin/connections", label: "Connections" },
  { href: "/admin/accountability/disputes", label: "Score Disputes" },
];

type NavSection = {
  title: string;
  items: Array<{ href: string; label: string }>;
  accent?: "primary" | "warning";
};

export default function Navigation({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";
  const sidebarSections = useMemo<NavSection[]>(() => {
    const sections: NavSection[] = [
      { title: "Core", items: publicNavItems },
      { title: "Analytics", items: analyticsNavItems },
      { title: "More", items: moreNavItems },
    ];

    if (isAdmin) {
      sections.push({ title: "Admin", items: adminNavItems, accent: "warning" });
    }

    return sections;
  }, [isAdmin]);

  const renderNavItem = (item: { href: string; label: string }, accent?: NavSection["accent"]) => {
    const isActive = pathname === item.href || 
      (item.href !== "/" && pathname.startsWith(item.href));
    const baseAccent = accent === "warning"
      ? "text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
      : "text-slate-600 dark:text-slate-400";
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            : `${baseAccent} hover:bg-slate-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100`
        }`}
      >
        <span className={isCollapsed ? "sr-only" : ""}>{item.label}</span>
        <span
          className={`h-2 w-2 rounded-full ${isActive ? "bg-blue-500" : "bg-transparent"}`}
          aria-hidden
        />
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-slate-900 dark:text-white">PROOF</span>
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
              Transparency
            </span>
          </Link>

          <div className="hidden lg:block max-w-md flex-1 px-6">
            <GlobalSearch />
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/my/settings"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                    {user?.displayName?.[0] || user?.walletAddress?.[0] || "U"}
                  </span>
                  <span className="hidden sm:inline">
                    {user?.displayName || user?.walletAddress?.slice(0, 8) + "..." || "Account"}
                  </span>
                </Link>
                <button
                  onClick={() => logout()}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  Logout
                </button>
              </div>
            ) : (
              <WalletConnect />
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
        <aside
          className={`sticky top-24 hidden h-[calc(100vh-6rem)] self-start rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70 lg:block ${
            isCollapsed ? "w-20" : "w-64"
          }`}
        >
          <button
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="mb-4 flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <span className={isCollapsed ? "sr-only" : ""}>Collapse</span>
            <span className="text-sm">{isCollapsed ? "»" : "«"}</span>
          </button>

          <div className="space-y-5">
            {sidebarSections.map((section) => (
              <div key={section.title} className="space-y-2">
                <div
                  className={`text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 ${
                    isCollapsed ? "sr-only" : ""
                  }`}
                >
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => renderNavItem(item, section.accent))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 lg:hidden">
        <div className="flex items-center justify-between gap-1 overflow-x-auto px-4 py-3">
          {publicNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-[72px] flex-1 flex-col items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "text-slate-900 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-blue-500" : "bg-transparent"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
