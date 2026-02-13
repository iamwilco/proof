"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
];

export default function Navigation() {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useSession();

  const isAdmin = user?.role === "ADMIN" || user?.role === "MODERATOR";

  const renderNavItem = (item: { href: string; label: string }) => {
    const isActive = pathname === item.href || 
      (item.href !== "/" && pathname.startsWith(item.href));
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        }`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900 dark:text-white">PROOF</span>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            Transparency
          </span>
        </Link>

        <div className="hidden lg:block">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-1">
          {publicNavItems.map(renderNavItem)}
          
          <span className="mx-2 h-4 w-px bg-slate-200 dark:bg-slate-700" />
          
          {analyticsNavItems.map(renderNavItem)}
          
          <div className="group relative">
            <button className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100">
              More ▾
            </button>
            <div className="invisible absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-lg border border-slate-200 bg-white py-1 opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800">
              {moreNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-100"
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin && (
                <>
                  <div className="my-1 border-t border-slate-200 dark:border-slate-700" />
                  <div className="px-4 py-1 text-xs font-medium text-slate-400 dark:text-slate-500">Admin</div>
                  {adminNavItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="block px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/20 dark:hover:text-amber-300"
                    >
                      {item.label}
                    </Link>
                  ))}
                </>
              )}
            </div>
          </div>

          <span className="mx-2 h-4 w-px bg-slate-200 dark:bg-slate-700" />
          
          <ThemeToggle />
          
          <div className="ml-2">
            {isLoading ? (
              <div className="h-9 w-24 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            ) : isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/my/settings"
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <span className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">
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
      </div>
    </nav>
  );
}
