"use client";

import { PointerEvent, useMemo, useRef, useState } from "react";

type Student = {
  id: string;
  name: string;
  email: string;
  initials: string;
};

type Week = {
  number: number;
  label: string;
  due: string;
  locked: boolean;
  submitted: boolean;
};

type FeedbackMap = Record<string, string>;

const groupMembers: Student[] = [
  { id: "s1", name: "Amina Rahman", email: "amina.rahman@student.edu", initials: "AR" },
  { id: "s2", name: "Ben Carter", email: "ben.carter@student.edu", initials: "BC" },
  { id: "s3", name: "Chloe Nguyen", email: "chloe.nguyen@student.edu", initials: "CN" },
  { id: "s4", name: "Daniel Kim", email: "daniel.kim@student.edu", initials: "DK" },
  { id: "s5", name: "Sinan Haque", email: "sinan.haque@student.edu", initials: "SH" },
];

const weeks: Week[] = [
  { number: 1, label: "Week 1", due: "Sun 23 Jun, 11:55 PM", locked: false, submitted: false },
  { number: 2, label: "Week 2", due: "Sun 30 Jun, 11:55 PM", locked: false, submitted: false },
  { number: 3, label: "Week 3", due: "Sun 7 Jul, 11:55 PM", locked: true, submitted: true },
  { number: 4, label: "Week 4", due: "Sun 14 Jul, 11:55 PM", locked: true, submitted: false },
];

const colours = ["#31536a", "#59798e", "#88a0ae", "#b5c3cb", "#d4dee4", "#e6ecef"];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildEvenHandles(memberCount: number) {
  return Array.from({ length: memberCount - 1 }, (_, index) => Math.round(((index + 1) * 100) / memberCount));
}

function handlesToAllocations(handles: number[]) {
  const points = [0, ...handles, 100];
  return points.slice(1).map((point, index) => point - points[index]);
}

export default function StudentAssessmentPage() {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [handles, setHandles] = useState<number[]>(() => buildEvenHandles(groupMembers.length));
  const [feedback, setFeedback] = useState<FeedbackMap>(() =>
    Object.fromEntries(groupMembers.map((member) => [member.id, ""]))
  );
  const [submittedWeeks, setSubmittedWeeks] = useState<number[]>([3]);
  const [showReview, setShowReview] = useState(false);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const week = weeks.find((item) => item.number === selectedWeek) ?? weeks[0];
  const isSubmitted = submittedWeeks.includes(selectedWeek) || week.submitted;
  const isLocked = week.locked || isSubmitted;
  const allocations = useMemo(() => handlesToAllocations(handles), [handles]);
  const total = allocations.reduce((sum, value) => sum + value, 0);

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

  function handleSubmit() {
    setSubmittedWeeks((current) => Array.from(new Set([...current, selectedWeek])));
    setShowReview(true);
  }

  function resetCurrentWeek() {
    if (isLocked) return;
    setHandles(buildEvenHandles(groupMembers.length));
    setFeedback(Object.fromEntries(groupMembers.map((member) => [member.id, ""])));
  }

  return (
    <main className="min-h-screen bg-brand-background text-brand-text">
      <nav className="border-b border-brand-border bg-brand-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary font-semibold text-white">U</div>
            <div>
              <p className="text-sm font-semibold">University Team Assessment</p>
              <p className="text-xs text-brand-muted">Student submission portal</p>
            </div>
          </div>
          <div className="hidden rounded-full border border-brand-border px-4 py-2 text-sm text-brand-muted sm:block">
            Logged in as Sinan Haque
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Assessment</p>
            <h1 className="mt-2 text-2xl font-bold">COMP3000 Assessment 1</h1>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-brand-background p-3">
                <p className="text-brand-muted">Class</p>
                <p className="font-semibold">Tutorial 03</p>
              </div>
              <div className="rounded-xl bg-brand-background p-3">
                <p className="text-brand-muted">Group</p>
                <p className="font-semibold">Group 4</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-surface p-4 shadow-soft">
            <p className="mb-3 px-1 text-sm font-semibold">Weeks</p>
            <div className="space-y-2">
              {weeks.map((item) => {
                const submitted = submittedWeeks.includes(item.number) || item.submitted;
                return (
                  <button
                    key={item.number}
                    onClick={() => setSelectedWeek(item.number)}
                    className={`focus-ring w-full rounded-xl border px-4 py-3 text-left transition ${
                      selectedWeek === item.number
                        ? "border-brand-primary bg-brand-primary text-white"
                        : "border-brand-border bg-white hover:bg-brand-background"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold">{item.label}</span>
                      <span className={`rounded-full px-2 py-1 text-xs ${selectedWeek === item.number ? "bg-white/15" : "bg-brand-background"}`}>
                        {submitted ? "Submitted" : item.locked ? "Locked" : "Open"}
                      </span>
                    </div>
                    <p className={`mt-1 text-xs ${selectedWeek === item.number ? "text-white/75" : "text-brand-muted"}`}>Due {item.due}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-soft">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
              <div>
                <p className="text-sm font-semibold text-brand-primary">{week.label} submission</p>
                <h2 className="mt-1 text-3xl font-bold">Allocate contribution points</h2>
                <p className="mt-2 max-w-2xl text-sm text-brand-muted">
                  Drag the dividers to split 100 contribution points across your group. Each segment represents one team member.
                </p>
              </div>
              <div className={`rounded-full px-4 py-2 text-sm font-semibold ${isLocked ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-700"}`}>
                {isSubmitted ? "Submitted - locked" : week.locked ? "Deadline passed" : "Open for submission"}
              </div>
            </div>

            <div className="mt-8">
              <div ref={trackRef} className="segment-slider relative h-16 rounded-2xl border border-brand-border bg-brand-background p-2">
                <div className="flex h-full overflow-hidden rounded-xl">
                  {allocations.map((allocation, index) => (
                    <div
                      key={groupMembers[index].id}
                      className="flex min-w-[26px] items-center justify-center text-xs font-bold text-white"
                      style={{ width: `${allocation}%`, backgroundColor: colours[index % colours.length] }}
                      title={`${groupMembers[index].name}: ${allocation} points`}
                    >
                      {allocation >= 8 ? allocation : ""}
                    </div>
                  ))}
                </div>
                {handles.map((handle, index) => (
                  <button
                    key={index}
                    aria-label={`Move divider ${index + 1}`}
                    disabled={isLocked}
                    onPointerDown={(event) => startDrag(event, index)}
                    onPointerMove={(event) => {
                      if (event.buttons === 1) updateHandle(index, event.clientX);
                    }}
                    className="absolute top-1/2 h-12 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-primary shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ left: `${handle}%` }}
                  />
                ))}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                <p className="text-brand-muted">Total allocated: <span className="font-bold text-brand-text">{total}/100</span></p>
                <button onClick={resetCurrentWeek} disabled={isLocked} className="focus-ring rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold hover:bg-brand-background disabled:cursor-not-allowed disabled:opacity-50">
                  Reset split
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-soft">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">Contribution table</h3>
                <p className="mt-1 text-sm text-brand-muted">Values update automatically from the slider above.</p>
              </div>
            </div>
            <div className="mt-5 overflow-hidden rounded-xl border border-brand-border">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead className="bg-brand-background text-brand-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-4 py-3 font-semibold">Email</th>
                    <th className="px-4 py-3 font-semibold">Contribution points</th>
                    <th className="px-4 py-3 font-semibold">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border bg-white">
                  {groupMembers.map((member, index) => (
                    <tr key={member.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: colours[index % colours.length] }}>{member.initials}</div>
                          <span className="font-semibold">{member.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-brand-muted">{member.email}</td>
                      <td className="px-4 py-4 font-bold">{allocations[index]}</td>
                      <td className="px-4 py-4 text-brand-muted">{allocations[index]}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-surface p-6 shadow-soft">
            <h3 className="text-xl font-bold">Weekly feedback</h3>
            <div className="mt-5 grid gap-4">
              {groupMembers.map((member) => (
                <label key={member.id} className="block rounded-xl border border-brand-border bg-white p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Feedback for {member.name}</p>
                    </div>
                    {member.name === "Sinan Haque" && <span className="rounded-full bg-brand-background px-3 py-1 text-xs font-semibold text-brand-muted">Self</span>}
                  </div>
                  <textarea
                    value={feedback[member.id]}
                    onChange={(event) => setFeedback((current) => ({ ...current, [member.id]: event.target.value }))}
                    disabled={isLocked}
                    placeholder={`Write feedback for ${member.name}...`}
                    className="focus-ring min-h-24 w-full resize-y rounded-xl border border-brand-border bg-brand-background px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-stretch justify-between gap-3 rounded-2xl border border-brand-border bg-brand-surface p-5 shadow-soft sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold">Submit {week.label}</p>
              <p className="text-sm text-brand-muted">Once submitted, this week becomes locked and cannot be edited by the student.</p>
            </div>
            <button
              onClick={handleSubmit}
              disabled={isLocked}
              className="focus-ring rounded-xl bg-brand-primary px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSubmitted ? "Already submitted" : week.locked ? "Submission locked" : "Submit weekly assessment"}
            </button>
          </div>

          {showReview && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
              <p className="font-bold">Submission saved for {week.label}.</p>
              <p className="mt-1 text-sm">This mock page has locked the week locally. In the full app, this would be saved to PostgreSQL.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
