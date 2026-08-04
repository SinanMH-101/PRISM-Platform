"use client";

import { ReactNode, useState } from "react";

type AssessmentView = "dashboard" | "groups" | "groupView";

export default function EducatorAssessmentViews({
  dashboard,
  sidebar,
  groupManager,
  groupView,
  initialView,
}: {
  dashboard: ReactNode;
  sidebar: ReactNode;
  groupManager: ReactNode;
  groupView: ReactNode;
  initialView: AssessmentView;
}) {
  const [view, setView] = useState<AssessmentView>(initialView);

  function selectView(nextView: AssessmentView) {
    setView(nextView);
    const url = new URL(window.location.href);
    url.searchParams.set("view", nextView);
    window.history.replaceState(window.history.state, "", url);
  }

  return (
    <section className="mx-auto max-w-7xl px-5 py-7">
      <div className="mb-7 flex gap-2 rounded-xl border border-brand-border bg-brand-surface p-1.5 shadow-soft sm:w-fit" role="tablist" aria-label="Assessment views">
        <ViewButton active={view === "groups"} onClick={() => selectView("groups")} label="Manage groups" />
        <ViewButton active={view === "groupView"} onClick={() => selectView("groupView")} label="Group view" />
        <ViewButton active={view === "dashboard"} onClick={() => selectView("dashboard")} label="Dashboard" />
      </div>

      <div role="tabpanel" aria-label={view === "dashboard" ? "Dashboard" : "Manage groups"}>
        {view === "dashboard" ? dashboard : view === "groupView" ? groupView : (
          <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-6">{sidebar}</aside>
            <div className="flex min-w-0 justify-center">{groupManager}</div>
          </div>
        )}
      </div>
    </section>
  );
}

function ViewButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`focus-ring flex-1 rounded-lg px-5 py-2.5 text-sm font-semibold transition sm:flex-none ${
        active ? "bg-brand-primary text-white shadow-sm" : "text-brand-muted hover:bg-brand-background hover:text-brand-text"
      }`}
    >
      {label}
    </button>
  );
}
