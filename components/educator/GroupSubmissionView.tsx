"use client";

import { useState } from "react";

type Submission = {
  id: string;
  weekNumber: number;
  submittedAt: string;
  submittedBy: { id: string; name: string };
  scores: { targetStudentId: string; targetStudentName: string; points: number }[];
  feedback: { toStudentId: string; toStudentName: string; comment: string }[];
};

type Group = {
  id: string;
  name: string;
  className: string;
  members: { id: string; name: string }[];
  submissions: Submission[];
};

export default function GroupSubmissionView({ groups, weekNumbers }: { groups: Group[]; weekNumbers: number[] }) {
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id ?? "");
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const group = groups.find((item) => item.id === selectedGroupId) ?? groups[0];
  const selectedWeek = weekNumbers[selectedWeekIndex];
  const submissions = group?.submissions.filter((submission) => submission.weekNumber === selectedWeek) ?? [];

  if (!group) {
    return <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface p-10 text-center text-brand-muted shadow-soft">Create a group before using Group view.</div>;
  }

  function chooseGroup(groupId: string) {
    setSelectedGroupId(groupId);
  }

  return (
    <div className="grid min-h-[620px] gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface shadow-soft">
        <div className="border-b border-brand-border p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-primary">Groups</p>
          <p className="mt-1 text-sm text-brand-muted">Select a group to inspect.</p>
        </div>
        <div className="max-h-[700px] space-y-1 overflow-y-auto p-2">
          {groups.map((item) => {
            const isActive = item.id === group.id;
            return (
              <button key={item.id} type="button" onClick={() => chooseGroup(item.id)} className={`focus-ring w-full rounded-lg px-3 py-3 text-left transition ${isActive ? "bg-brand-primary text-white" : "hover:bg-brand-background"}`}>
                <span className="block truncate font-semibold">{item.name}</span>
                <span className={`mt-1 block text-xs ${isActive ? "text-white/75" : "text-brand-muted"}`}>{item.members.length} {item.members.length === 1 ? "student" : "students"} · {item.submissions.length} submissions</span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="min-w-0 overflow-hidden rounded-xl border border-brand-border bg-brand-surface shadow-soft">
        <header className="border-b border-brand-border p-5 sm:flex sm:items-end sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-primary">{group.className}</p>
            <h2 className="mt-1 text-2xl font-bold">{group.name}</h2>
            <p className="mt-1 text-sm text-brand-muted">Review individual submissions, feedback, and contribution allocations.</p>
          </div>
          {weekNumbers.length > 0 && (
            <div className="mt-4 flex items-center overflow-hidden rounded-lg border border-brand-border bg-white sm:mt-0" aria-label="Select assessment week">
              <button type="button" aria-label="Previous week" disabled={selectedWeekIndex === 0} onClick={() => setSelectedWeekIndex((index) => Math.max(0, index - 1))} className="focus-ring flex h-11 w-11 items-center justify-center border-r border-brand-border text-xl font-bold text-brand-primary hover:bg-brand-background disabled:cursor-not-allowed disabled:text-slate-300">‹</button>
              <div className="min-w-28 px-4 text-center"><p className="text-sm font-bold">Week {selectedWeek}</p><p className="text-[11px] text-brand-muted">{selectedWeekIndex + 1} of {weekNumbers.length}</p></div>
              <button type="button" aria-label="Next week" disabled={selectedWeekIndex === weekNumbers.length - 1} onClick={() => setSelectedWeekIndex((index) => Math.min(weekNumbers.length - 1, index + 1))} className="focus-ring flex h-11 w-11 items-center justify-center border-l border-brand-border text-xl font-bold text-brand-primary hover:bg-brand-background disabled:cursor-not-allowed disabled:text-slate-300">›</button>
            </div>
          )}
        </header>

        {submissions.length === 0 ? (
          <div className="flex min-h-[430px] items-center justify-center p-8 text-center">
            <div><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-background text-xl text-brand-muted">0</div><h3 className="mt-4 font-bold">No submissions to show</h3><p className="mt-1 text-sm text-brand-muted">Student feedback and point allocations will appear here after submission.</p></div>
          </div>
        ) : (
          <div className="space-y-5 bg-brand-background/50 p-5">
            {submissions.map((submission) => (
              <article key={submission.id} className="overflow-hidden rounded-xl border border-brand-border bg-white">
                <div className="flex flex-col justify-between gap-2 border-b border-brand-border px-5 py-4 sm:flex-row sm:items-center">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Submission from</p><p className="mt-1 font-bold text-brand-text">{submission.submittedBy.name}</p></div>
                  <time className="text-xs font-medium text-brand-muted">Submitted {formatDate(submission.submittedAt)}</time>
                </div>

                <div className="grid gap-6 p-5 xl:grid-cols-[minmax(240px,0.8fr)_minmax(320px,1.2fr)]">
                  <div>
                    <h4 className="text-sm font-bold">Point allocation</h4>
                    <div className="mt-3 space-y-3">
                      {submission.scores.map((score) => (
                        <div key={score.targetStudentId}>
                          <div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="font-medium">{score.targetStudentName}</span><span className="font-bold">{score.points}</span></div>
                          <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-primary" style={{ width: `${score.points}%` }} /></div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold">Feedback comments</h4>
                    <div className="mt-3 grid gap-3">
                      {submission.feedback.map((item) => (
                        <div key={item.toStudentId} className={`rounded-lg border p-3 ${item.toStudentId === submission.submittedBy.id ? "border-brand-primary/30 bg-brand-background" : "border-brand-border bg-white"}`}>
                          <div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold">For {item.toStudentName}</p>{item.toStudentId === submission.submittedBy.id && <span className="rounded-full bg-brand-primary px-2 py-0.5 text-[10px] font-bold uppercase text-white">Self reflection</span>}</div>
                          <p className={`mt-2 whitespace-pre-wrap text-sm ${item.comment ? "text-brand-text" : "italic text-brand-muted"}`}>{item.comment || "No comment provided."}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}
