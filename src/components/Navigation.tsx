"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/funds", label: "Funds" },
  { href: "/projects", label: "Projects" },
  { href: "/people", label: "People" },
  { href: "/milestones", label: "Milestones" },
  { href: "/reports", label: "Reports" },
  { href: "/voting", label: "Voting" },
  { href: "/flags", label: "Flags" },
  { href: "/communities", label: "Communities" },
  { href: "/organizations", label: "Organizations" },
  { href: "/graph", label: "Graph" },
  { href: "/rankings", label: "Rankings" },
  { href: "/export", label: "Export" },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-slate-900">PROOF</span>
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Transparency
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
