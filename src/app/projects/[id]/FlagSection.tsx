"use client";

import { useState } from "react";
import FlagSubmissionForm from "../../../components/FlagSubmissionForm";

interface FlagSectionProps {
  projectId: string;
  projectTitle: string;
}

export default function FlagSection({ projectId, projectTitle }: FlagSectionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Community Oversight</h2>
          <p className="mt-1 text-sm text-slate-500">
            Help maintain transparency by reporting concerns about this project.
          </p>
        </div>
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
          >
            <span>🚩</span>
            Report Concern
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-6 border-t border-slate-100 pt-6">
          <FlagSubmissionForm
            projectId={projectId}
            projectTitle={projectTitle}
            onSuccess={() => setIsOpen(false)}
            onCancel={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
