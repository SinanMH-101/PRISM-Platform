"use client";

import { deleteAssessmentAction } from "@/app/admin/actions";

export default function DeleteAssessmentButton({ assessmentId, assessmentName }: { assessmentId: string; assessmentName: string }) {
  return (
    <form
      action={deleteAssessmentAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${assessmentName}"? It will be removed from dashboards, but all historical information will be retained.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="assessmentId" value={assessmentId} />
      <button className="focus-ring rounded-lg border border-red-300 px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50">
        Delete assessment
      </button>
    </form>
  );
}
