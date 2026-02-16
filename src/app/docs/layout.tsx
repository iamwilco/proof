import Link from "next/link";

const sidebarNav = [
  {
    title: "Getting Started",
    items: [
      { name: "Introduction", href: "/docs/introduction" },
      { name: "Features", href: "/docs/features" },
    ],
  },
  {
    title: "User Guides",
    items: [
      { name: "Visitor Guide", href: "/docs/guide/visitor" },
      { name: "Member Guide", href: "/docs/guide/member" },
      { name: "Proposer Guide", href: "/docs/guide/proposer" },
      { name: "Reviewer Guide", href: "/docs/guide/reviewer" },
      { name: "Moderator Guide", href: "/docs/guide/moderator" },
    ],
  },
  {
    title: "Technical",
    items: [
      { name: "Architecture", href: "/docs/architecture" },
      { name: "API Reference", href: "/api/docs" },
    ],
  },
  {
    title: "Reference",
    items: [
      { name: "Limitations", href: "/docs/limitations" },
      { name: "FAQ", href: "/docs/faq" },
      { name: "Glossary", href: "/docs/glossary" },
    ],
  },
];

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <div className="mx-auto max-w-7xl flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 min-h-screen sticky top-0">
          <div className="p-6">
            <Link href="/docs" className="text-lg font-bold text-slate-900 dark:text-white">
              Documentation
            </Link>
          </div>
          <nav className="px-4 pb-8">
            {sidebarNav.map((section) => (
              <div key={section.title} className="mb-6">
                <h3 className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.items.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className="block px-2 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
