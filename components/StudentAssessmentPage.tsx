"use client";

import Link from "next/link";
import { BrandIdentity } from "@/components/BrandingProvider";
import { PointerEvent, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitStudentAssessment } from "@/app/student/assessments/actions";

export type StudentAssessmentData = {
  assessment: { id: string; name: string; unitCode: string; semester: string };
  educatorName: string;
  group: { id: string; name: string };
  currentStudent: { id: string; name: string };
  members: { id: string; name: string; email: string; initials: string }[];
  weeks: {
    id: string;
    number: number;
    due: string;
    status: "OPEN" | "UPCOMING" | "LOCKED" | "SUBMITTED";
    scores: Record<string, number> | null;
    scoreOverrides: Record<string, boolean> | null;
    feedback: Record<string, string> | null;
    receivedReviews: { fromStudentId: string; fromStudentName: string; fromStudentInitials: string; points: number; comment: string }[] | null;
  }[];
};

// Distinct, dark colours keep students easy to identify while preserving white-text contrast.
const studentColours = [
  "#1d4ed8", // blue
  "#c2410c", // orange
  "#047857", // green
  "#7e22ce", // purple
  "#be123c", // rose
  "#0e7490", // cyan
  "#a16207", // amber
  "#4338ca", // indigo
  "#0f766e", // teal
  "#a21caf", // fuchsia
];

function studentColour(index: number) {
  return studentColours[index % studentColours.length];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildEvenAllocations(memberCount: number) {
  if (!memberCount) return [];
  const base = Math.floor(100 / memberCount);
  return Array.from({ length: memberCount }, (_, index) => base + (index < 100 - base * memberCount ? 1 : 0));
}

function allocationsToHandles(allocations: number[]) {
  let total = 0;
  return allocations.slice(0, -1).map((value) => (total += value));
}

function handlesToAllocations(handles: number[]) {
  const points = [0, ...handles, 100];
  return points.slice(1).map((point, index) => point - points[index]);
}

export default function StudentAssessmentPage({ data }: { data: StudentAssessmentData }) {
  const router = useRouter();
  const [selectedWeekId, setSelectedWeekId] = useState(data.weeks[0]?.id ?? "");
  const week = data.weeks.find((item) => item.id === selectedWeekId) ?? data.weeks[0];
  const initialAllocations = useMemo(
    () => data.members.map((member, index) => week?.scores?.[member.id] ?? buildEvenAllocations(data.members.length)[index]),
    [data.members, week]
  );
  const [handles, setHandles] = useState(() => allocationsToHandles(initialAllocations));
  const [feedback, setFeedback] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.members.map((member) => [member.id, week?.feedback?.[member.id] ?? ""]))
  );
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const trackRef = useRef<HTMLDivElement | null>(null);

  if (!week) {
    return <EmptyState data={data} text="No submission weeks have been configured for this assessment." />;
  }

  const isLocked = week.status !== "OPEN";
  const allocations = handlesToAllocations(handles);
  const hasEducatorOverrides = Object.values(week.scoreOverrides ?? {}).some(Boolean);
  const currentStudentMember = data.members.find((member) => member.id === data.currentStudent.id);
  const teammateMembers = data.members.filter((member) => member.id !== data.currentStudent.id);

  function selectWeek(weekId: string) {
    const nextWeek = data.weeks.find((item) => item.id === weekId);
    if (!nextWeek) return;
    const even = buildEvenAllocations(data.members.length);
    const nextAllocations = data.members.map((member, index) => nextWeek.scores?.[member.id] ?? even[index]);
    setSelectedWeekId(weekId);
    setHandles(allocationsToHandles(nextAllocations));
    setFeedback(Object.fromEntries(data.members.map((member) => [member.id, nextWeek.feedback?.[member.id] ?? ""])));
    setMessage(null);
  }

  function updateHandle(index: number, clientX: number) {
    const track = trackRef.current;
    if (!track || isLocked) return;
    const rect = track.getBoundingClientRect();
    const raw = ((clientX - rect.left) / rect.width) * 100;
    const min = index === 0 ? 0 : handles[index - 1] + 1;
    const max = index === handles.length - 1 ? 100 : handles[index + 1] - 1;
    const next = [...handles];
    next[index] = Math.round(clamp(raw, min, max));
    setHandles(next);
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, index: number) {
    event.currentTarget.setPointerCapture(event.pointerId);
    updateHandle(index, event.clientX);
  }

  function resetCurrentWeek() {
    if (isLocked) return;
    setHandles(allocationsToHandles(buildEvenAllocations(data.members.length)));
    setFeedback(Object.fromEntries(data.members.map((member) => [member.id, ""])));
    setMessage(null);
  }

  function handleSubmit() {
    if (!window.confirm(`Submit Week ${week.number}? You cannot edit it afterwards.`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await submitStudentAssessment({
        assessmentId: data.assessment.id,
        groupId: data.group.id,
        weekId: week.id,
        scores: data.members.map((member, index) => ({ studentId: member.id, points: allocations[index] })),
        feedback: data.members.map((member) => ({ studentId: member.id, comment: feedback[member.id]?.trim() ?? "" })),
      });
      if (!result.ok) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setMessage({ type: "success", text: `Week ${week.number} was submitted and is now locked.` });
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen bg-brand-background text-brand-text">
      <nav className="border-b border-brand-border bg-brand-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <BrandIdentity subtitle="Student submission portal" />
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-brand-border px-4 py-2 text-sm text-brand-muted sm:block">Logged in as {data.currentStudent.name}</span>
            <Link href="/student/dashboard" className="focus-ring rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold hover:bg-brand-background">Dashboard</Link>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{data.assessment.unitCode} · {data.assessment.semester}</p>
            <h1 className="mt-2 text-2xl font-bold">{data.assessment.name}</h1>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Info label="Educator" value={data.educatorName} /><Info label="Group" value={data.group.name} />
            </div>
          </div>
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-soft">
            <p className="mb-3 px-1 text-sm font-semibold">Weeks</p>
            <div className="space-y-2">
              {data.weeks.map((item) => (
                <button key={item.id} onClick={() => selectWeek(item.id)} className={`focus-ring w-full rounded-xl border px-4 py-3 text-left transition ${item.id === week.id ? "border-brand-primary bg-brand-primary text-white" : "border-brand-border bg-white hover:bg-brand-background"}`}>
                  <div className="flex items-center justify-between gap-2"><span className="font-semibold">Week {item.number}</span><span className={`rounded-full px-2 py-1 text-xs ${item.id === week.id ? "bg-white/15" : "bg-brand-background"}`}>{statusLabel(item.status)}</span></div>
                  <p className={`mt-1 text-xs ${item.id === week.id ? "text-white/75" : "text-brand-muted"}`}>Due {item.due}</p>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-soft">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div><p className="text-sm font-semibold text-brand-primary">Week {week.number} submission</p><h2 className="mt-1 text-3xl font-bold">Allocate contribution points</h2><p className="mt-2 max-w-2xl text-sm text-brand-muted">Drag the dividers to split exactly 100 points across your group.</p></div>
              <div className={`rounded-full px-4 py-2 text-sm font-semibold ${isLocked ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>{statusDescription(week.status)}</div>
            </div>
            <div className="mt-8">
              {hasEducatorOverrides && <div className="mb-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 font-bold text-white">!</span><p><span className="font-bold">Scores adjusted by your educator.</span> An exclamation mark identifies each updated contribution score.</p></div>}
              <div ref={trackRef} className="segment-slider relative h-16 rounded-2xl border border-brand-border bg-brand-background p-2">
                <div className="flex h-full overflow-hidden rounded-xl">{allocations.map((allocation, index) => <div key={data.members[index].id} className="flex min-w-[2px] items-center justify-center text-xs font-bold text-white" style={{ width: `${allocation}%`, backgroundColor: studentColour(index) }} title={`${data.members[index].name}: ${allocation} points${week.scoreOverrides?.[data.members[index].id] ? " (adjusted by educator)" : ""}`}>{allocation >= 7 ? <>{allocation}{week.scoreOverrides?.[data.members[index].id] && <span className="ml-0.5">!</span>}</> : ""}</div>)}</div>
                {handles.map((handle, index) => <button key={index} aria-label={`Move divider ${index + 1}`} disabled={isLocked} onPointerDown={(event) => startDrag(event, index)} onPointerMove={(event) => event.buttons === 1 && updateHandle(index, event.clientX)} className="absolute top-1/2 h-12 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-primary shadow-lg disabled:cursor-not-allowed disabled:opacity-40" style={{ left: `${handle}%` }} />)}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-soft">
            <h3 className="text-xl font-bold">Contribution table</h3>
            <div className="mt-5 overflow-x-auto rounded-xl border border-brand-border"><table className="w-full min-w-[640px] border-collapse text-left text-sm"><thead className="bg-brand-background text-brand-muted"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Points</th><th className="px-4 py-3">Share</th></tr></thead><tbody className="divide-y divide-brand-border bg-white">{data.members.map((member, index) => <tr key={member.id} className="border-l-4" style={{ borderLeftColor: studentColour(index) }}><td className="px-4 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: studentColour(index) }}>{member.initials}</div><span className="font-semibold">{member.name}{member.id === data.currentStudent.id ? " (you)" : ""}</span></div></td><td className="px-4 py-4 text-brand-muted">{member.email}</td><td className="px-4 py-4 font-bold">{allocations[index]}{week.scoreOverrides?.[member.id] && <span className="ml-1 text-amber-600" title="Adjusted by educator">!</span>}</td><td className="px-4 py-4 text-brand-muted">{allocations[index]}%{week.scoreOverrides?.[member.id] && <span className="ml-1 font-bold text-amber-600" title="Adjusted by educator">!</span>}</td></tr>)}</tbody></table></div>
          </section>

          <section className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-soft">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <h3 className="text-xl font-bold">Weekly feedback</h3>
                <p className="mt-1 text-sm text-brand-muted">{week.status === "SUBMITTED" ? `Feedback and scores your teammates gave you for Week ${week.number}.` : "Reflect on your contribution and share feedback with your teammates."}</p>
              </div>
              {week.status === "SUBMITTED" && <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">Submission received</span>}
            </div>

            {week.status === "SUBMITTED" ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {(week.receivedReviews ?? []).map((review) => {
                  const memberIndex = data.members.findIndex((member) => member.id === review.fromStudentId);
                  const colour = studentColour(memberIndex < 0 ? 0 : memberIndex);
                  const comment = review.comment.trim();
                  return (
                    <article key={review.fromStudentId} className="overflow-hidden rounded-xl border border-brand-border bg-white" style={{ borderTopColor: colour, borderTopWidth: 4 }}>
                      <div className="flex items-center justify-between gap-3 border-b border-brand-border px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: colour }}>{review.fromStudentInitials}</div>
                          <div className="min-w-0"><p className="truncate font-semibold">{review.fromStudentName}</p><p className="text-xs text-brand-muted">Feedback for you</p></div>
                        </div>
                        <span className="shrink-0 rounded-full px-3 py-1 text-sm font-bold text-white" style={{ backgroundColor: colour }}>{review.points} points</span>
                      </div>
                      <p className={`min-h-24 whitespace-pre-wrap px-4 py-4 text-sm leading-6 ${comment ? "text-brand-text" : "italic text-brand-muted"}`}>{comment || "No comment provided."}</p>
                    </article>
                  );
                })}
                {(week.receivedReviews ?? []).length === 0 && <div className="sm:col-span-2 rounded-xl border border-dashed border-brand-border bg-brand-background p-6 text-center text-sm text-brand-muted">No teammate submissions are available yet. Their feedback and scores will appear here as they submit.</div>}
              </div>
            ) : <>
            {currentStudentMember && (
              <div className="mt-5 rounded-2xl border-2 border-brand-primary bg-brand-background p-5">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-brand-primary">Your reflection</p>
                    <p className="mt-1 text-lg font-bold">Reflect on your contribution this week! </p>
                  </div>
                  <span className="rounded-full bg-brand-primary px-3 py-1 text-xs font-semibold text-white">About you</span>
                </div>
                <textarea
                  value={feedback[currentStudentMember.id] ?? ""}
                  maxLength={2000}
                  onChange={(event) => setFeedback((current) => ({ ...current, [currentStudentMember.id]: event.target.value }))}
                  disabled={isLocked}
                  placeholder="Write a short reflection on your contribution this week..."
                  className="focus-ring min-h-28 w-full resize-y rounded-xl border border-brand-primary/40 bg-white px-4 py-3 text-sm disabled:opacity-60"
                />
              </div>
            )}

            <div className="mt-7 border-t border-brand-border pt-6">
              <h4 className="text-lg font-bold">Feedback for your teammates</h4>
              <div className="mt-4 grid gap-4">
                {teammateMembers.map((member) => (
                  <label key={member.id} className="block rounded-xl border border-brand-border bg-white p-4">
                    <p className="mb-3 font-semibold">Feedback for {member.name}</p>
                    <textarea
                      value={feedback[member.id] ?? ""}
                      maxLength={2000}
                      onChange={(event) => setFeedback((current) => ({ ...current, [member.id]: event.target.value }))}
                      disabled={isLocked}
                      placeholder={`Write feedback for ${member.name}...`}
                      className="focus-ring min-h-24 w-full resize-y rounded-xl border border-brand-border bg-brand-background px-4 py-3 text-sm disabled:opacity-60"
                    />
                  </label>
                ))}
              </div>
            </div>
            </>}
          </section>

          {message && <div className={`rounded-2xl border p-5 ${message.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`} role="status">{message.text}</div>}
          <section className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-soft sm:flex-row sm:items-center"><div><p className="font-semibold">Submit Week {week.number}</p><p className="text-sm text-brand-muted">Submission is final and cannot be edited.</p></div><button onClick={handleSubmit} disabled={isLocked || isPending} className="focus-ring rounded-xl bg-brand-primary px-5 py-3 font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300">{isPending ? "Submitting..." : week.status === "SUBMITTED" ? "Already submitted" : week.status === "UPCOMING" ? "Not open yet" : week.status === "LOCKED" ? "Submission locked" : "Submit weekly assessment"}</button></section>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-brand-background p-3"><p className="text-brand-muted">{label}</p><p className="font-semibold">{value}</p></div>; }
function statusLabel(status: StudentAssessmentData["weeks"][number]["status"]) { return status === "SUBMITTED" ? "Submitted" : status === "OPEN" ? "Open" : status === "UPCOMING" ? "Upcoming" : "Locked"; }
function statusDescription(status: StudentAssessmentData["weeks"][number]["status"]) { return status === "SUBMITTED" ? "Submitted — locked" : status === "OPEN" ? "Open for submission" : status === "UPCOMING" ? "Submission window not open" : "Deadline passed"; }
function EmptyState({ data, text }: { data: StudentAssessmentData; text: string }) { return <main className="min-h-screen bg-brand-background px-5 py-16 text-brand-text"><div className="mx-auto max-w-2xl rounded-2xl border border-brand-border bg-brand-surface p-8 text-center shadow-soft"><h1 className="text-2xl font-bold">{data.assessment.name}</h1><p className="mt-3 text-brand-muted">{text}</p><Link href="/student/dashboard" className="mt-6 inline-block rounded-lg bg-brand-primary px-4 py-3 font-semibold text-white">Back to dashboard</Link></div></main>; }
