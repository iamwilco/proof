import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";

const features = {
  shipped: [
    { title: "Proposal Discovery (Tinder)", description: "Swipe through proposals to discover and bookmark" },
    { title: "Fund Explorer", description: "Browse all Catalyst funds with statistics" },
    { title: "People Directory", description: "Search and explore proposal team members" },
    { title: "Knowledge Graph", description: "Visualize connections between entities" },
  ],
  inProgress: [
    { title: "Design System Overhaul", description: "New component library with dark mode support" },
    { title: "Multi-Provider Authentication", description: "Sign in with Cardano wallet, Google, or email" },
    { title: "Role-Based Navigation", description: "Tailored views based on user role" },
  ],
  planned: [
    { title: "Accountability Scoring", description: "Automated scoring of proposer track records", votes: 47 },
    { title: "Admin Connection Management", description: "Manually link people to organizations/projects", votes: 35 },
    { title: "Red Flag Detection", description: "Automated detection of concerning patterns", votes: 52 },
    { title: "ROI Calculation", description: "Measure project outcomes vs funding received", votes: 61 },
  ],
  considering: [
    { title: "Social Metrics Integration", description: "Twitter, Discord activity tracking", votes: 28 },
    { title: "AI-Powered Comparison", description: "Compare similar proposals using AI", votes: 44 },
    { title: "Mobile App", description: "Native iOS and Android applications", votes: 39 },
    { title: "Notifications System", description: "Get alerts for projects you follow", votes: 33 },
  ],
};

export default function RoadmapPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Roadmap</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          See what we&apos;re building and vote for features you want next
        </p>
      </div>

      <div className="space-y-8">
        {/* In Progress */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
            <span className="h-3 w-3 rounded-full bg-blue-500" />
            In Progress
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {features.inProgress.map((feature) => (
              <Card key={feature.title} variant="outlined">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{feature.title}</CardTitle>
                    <Badge variant="info" size="sm">Building</Badge>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Planned */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            Planned
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {features.planned.map((feature) => (
              <Card key={feature.title} variant="outlined">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{feature.title}</CardTitle>
                    <Badge variant="warning" size="sm">Planned</Badge>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400">
                    <span>▲</span>
                    <span>{feature.votes} votes</span>
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Considering */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
            <span className="h-3 w-3 rounded-full bg-slate-400" />
            Considering
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {features.considering.map((feature) => (
              <Card key={feature.title} variant="outlined">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{feature.title}</CardTitle>
                    <Badge variant="default" size="sm">Idea</Badge>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400">
                    <span>▲</span>
                    <span>{feature.votes} votes</span>
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Shipped */}
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
            <span className="h-3 w-3 rounded-full bg-green-500" />
            Recently Shipped
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {features.shipped.map((feature) => (
              <Card key={feature.title} variant="outlined" className="opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{feature.title}</CardTitle>
                    <Badge variant="success" size="sm">Shipped</Badge>
                  </div>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Submit Idea */}
      <div className="mt-12 rounded-xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-700 dark:bg-slate-800/50">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Have an idea?</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Sign in to submit feature requests and vote on existing ideas
        </p>
        <button className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700">
          Sign In to Submit
        </button>
      </div>
    </main>
  );
}
