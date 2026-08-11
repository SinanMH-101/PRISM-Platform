"use client";

import { useActionState, useState } from "react";
import { overrideContributionScoresAction, type OverrideScoresActionState } from "@/app/educator/actions";

type Submission = {
  id: string;
  weekNumber: number;
  submittedAt: string;
  submittedBy: { id: string; name: string };
  scores: { targetStudentId: string; targetStudentName: string; originalPoints: number; points: number; overridden: boolean }[];
  feedback: { toStudentId: string; toStudentName: string; comment: string }[];
};

type Group = {
  id: string;
  name: string;
  className: string;
  educatorName?: string | null;
  members: { id: string; name: string }[];
  submissions: Submission[];
};

export default function GroupSubmissionView({ assessmentId, groups, weekNumbers, readOnly = false }: { assessmentId: string; groups: Group[]; weekNumbers: number[]; readOnly?: boolean }) {
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id ?? "");
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [editingSubmission, setEditingSubmission] = useState<Submission | null>(null);
  const [overrideState, overrideAction, overridePending] = useActionState(overrideContributionScoresAction, { status: "idle" } as OverrideScoresActionState);
  const group = groups.find((item) => item.id === selectedGroupId) ?? groups[0];
  const selectedWeek = weekNumbers[selectedWeekIndex];
  const submissions = group?.submissions.filter((submission) => submission.weekNumber === selectedWeek) ?? [];
  const memberIds = new Set(group?.members.map((member) => member.id) ?? []);
  const memberSubmissions = submissions.filter((submission) => memberIds.has(submission.submittedBy.id));
  const completedMemberSubmissions = memberSubmissions.filter((submission) => submissionIsComplete(submission, memberIds));
  const allStudentsSubmitted = Boolean(group?.members.length) && group.members.every((member) => completedMemberSubmissions.some((submission) => submission.submittedBy.id === member.id));
  const finalDistribution = allStudentsSubmitted
    ? group.members.map((member) => ({
        id: member.id,
        name: member.name,
        points: completedMemberSubmissions.reduce((sum, submission) => sum + (submission.scores.find((score) => score.targetStudentId === member.id)?.points ?? 0), 0) / completedMemberSubmissions.length,
      }))
    : [];

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
                <span className={`mt-1 block truncate text-xs font-medium ${isActive ? "text-white/90" : "text-brand-primary"}`}>{item.educatorName ?? "Unassigned TA"}</span>
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
            <p className="mt-1 text-sm font-semibold text-brand-primary">TA: {group.educatorName ?? "Unassigned"}</p>
            {selectedWeek !== undefined && <p className="mt-2 text-sm font-semibold text-brand-primary">Week {selectedWeek}: {memberSubmissions.length}/{group.members.length} submitted</p>}
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
            {allStudentsSubmitted && (
              <section className="rounded-xl border-2 border-emerald-200 bg-emerald-50 p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div><p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Week {selectedWeek} complete</p><h3 className="mt-1 text-lg font-bold text-brand-text">Final point distribution</h3></div>
                  <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">All submitted</span>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {finalDistribution.map((result) => (
                    <div key={result.id} className="rounded-lg border border-emerald-200 bg-white p-4">
                      <p className="truncate text-sm font-semibold text-brand-text">{result.name}</p>
                      <p className="mt-1 text-2xl font-bold text-emerald-700">{formatPoints(result.points)}</p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${result.points}%` }} /></div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {submissions.map((submission) => (
              <article key={submission.id} className="overflow-hidden rounded-xl border border-brand-border bg-white">
                <div className="flex flex-col justify-between gap-2 border-b border-brand-border px-5 py-4 sm:flex-row sm:items-center">
                  <div><p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Submission from</p><div className="mt-1 flex flex-wrap items-center gap-2"><p className="font-bold text-brand-text">{submission.submittedBy.name}</p>{!submissionIsComplete(submission, memberIds) && <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-700">Incomplete: resubmission required</span>}</div></div>
                  <div className="flex flex-wrap items-center gap-3">
                    <time className="text-xs font-medium text-brand-muted">Submitted {formatDate(submission.submittedAt)}</time>
                    {!readOnly && <button type="button" onClick={() => setEditingSubmission(submission)} className="focus-ring rounded-lg border border-brand-border px-3 py-2 text-xs font-bold text-brand-primary hover:bg-brand-background">Adjust scores</button>}
                  </div>
                </div>

                <div className="grid gap-6 p-5 xl:grid-cols-[minmax(240px,0.8fr)_minmax(320px,1.2fr)]">
                  <div>
                    <h4 className="text-sm font-bold">Point allocation</h4>
                    <div className="mt-3 space-y-3">
                      {submission.scores.map((score) => (
                        <div key={score.targetStudentId}>
                          <div className="mb-1.5 flex justify-between gap-3 text-sm"><span className="font-medium">{score.targetStudentName}</span><span className="font-bold">{score.points}{score.overridden && <span className="ml-1 text-amber-600" title={`Originally ${score.originalPoints} points`}>!</span>}</span></div>
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

      {!readOnly && editingSubmission && (
        <div role="dialog" aria-modal="true" aria-labelledby="override-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingSubmission(null); }}>
          <div className="w-full max-w-lg rounded-xl bg-brand-surface p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="override-title" className="text-xl font-bold">Adjust contribution scores</h2><p className="mt-1 text-sm text-brand-muted">Submission from {editingSubmission.submittedBy.name}, Week {editingSubmission.weekNumber}</p></div>
              <button type="button" aria-label="Close" onClick={() => setEditingSubmission(null)} className="focus-ring rounded-lg p-2 text-2xl leading-none text-brand-muted hover:bg-brand-background">×</button>
            </div>
            <form action={overrideAction} className="mt-5 space-y-4">
              <input type="hidden" name="assessmentId" value={assessmentId} />
              <input type="hidden" name="submissionId" value={editingSubmission.id} />
              <div className="space-y-3">
                {editingSubmission.scores.map((score) => (
                  <label key={score.targetStudentId} className="flex items-center justify-between gap-4 rounded-lg border border-brand-border p-3 text-sm font-semibold">
                    <span>{score.targetStudentName}<span className="mt-0.5 block text-xs font-normal text-brand-muted">Student allocation: {score.originalPoints}</span></span>
                    <input required type="number" min={0} max={100} step={1} name={`score:${score.targetStudentId}`} defaultValue={score.points} className="focus-ring h-10 w-24 rounded-lg border border-brand-border px-3 text-right font-bold" />
                  </label>
                ))}
              </div>
              <p className="text-sm text-brand-muted">Adjusted scores must total exactly 100 points.</p>
              {overrideState.message && <p role="status" className={`rounded-lg p-3 text-sm font-medium ${overrideState.status === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>{overrideState.message}</p>}
              <div className="flex flex-wrap justify-end gap-3 pt-1">
                {editingSubmission.scores.some((score) => score.overridden) && <button type="submit" name="reset" value="true" formNoValidate disabled={overridePending} className="focus-ring mr-auto rounded-lg border border-brand-border px-4 py-2.5 text-sm font-semibold text-brand-primary hover:bg-brand-background disabled:opacity-50">Restore original</button>}
                <button type="button" onClick={() => setEditingSubmission(null)} className="focus-ring rounded-lg border border-brand-border px-4 py-2.5 text-sm font-semibold">Cancel</button>
                <button disabled={overridePending} className="focus-ring rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50">{overridePending ? "Saving..." : "Save adjusted scores"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function submissionIsComplete(submission: Submission, memberIds: Set<string>) {
  const scoreIds = new Set(submission.scores.map((score) => score.targetStudentId));
  return scoreIds.size === memberIds.size
    && [...memberIds].every((id) => scoreIds.has(id))
    && submission.scores.reduce((sum, score) => sum + score.points, 0) === 100;
}
