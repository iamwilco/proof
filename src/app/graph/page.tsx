"use client";

import { Suspense } from "react";
import GraphClient from "./GraphClient";

export default function GraphPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 py-12">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Network Graph</h1>
          <p className="mt-2 text-base text-slate-600">
            Visualize relationships across projects, people, and funds.
          </p>
        </header>
        <Suspense fallback={<div className="flex h-96 items-center justify-center text-slate-500">Loading graph...</div>}>
          <GraphClient />
        </Suspense>
      </div>
    </div>
  );
}
