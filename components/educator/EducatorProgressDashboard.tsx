type Week = {
  id: string;
  weekNumber: number;
  opensAt: Date;
  dueAt: Date;
  locked: boolean;
};

type ProgressGroup = {
  id: string;
  name: string;
  className: string;
  educatorName: string | null;
  members: { studentId: string }[];
  submissions: { assessmentWeekId: string; submittedByStudentId: string; submittedAt: Date }[];
};

export default function EducatorProgressDashboard({
  groups,
  weeks,
  currentEducatorName,
}: {
  groups: ProgressGroup[];
  weeks: Week[];
  currentEducatorName: string;
}) {
  const now = new Date();
  const openedWeeks = weeks.filter((week) => week.opensAt <= now);
  const completedWeeks = openedWeeks.filter((week) => week.dueAt < now || week.locked);
  const focusWeek = openedWeeks.find((week) => week.opensAt <= now && week.dueAt >= now && !week.locked) ?? openedWeeks.at(-1) ?? null;
  const totalStudents = groups.reduce((sum, group) => sum + group.members.length, 0);
  const expectedToDate = groups.reduce((sum, group) => sum + group.members.length * openedWeeks.length, 0);
  const submittedToDate = groups.reduce(
    (sum, group) => sum + countValidSubmissions(group, new Set(openedWeeks.map((week) => week.id))),
    0
  );
  const overallProgress = percentage(submittedToDate, expectedToDate);
  const overdueMissing = groups.reduce(
    (sum, group) => sum + group.members.length * completedWeeks.length - countValidSubmissions(group, new Set(completedWeeks.map((week) => week.id))),
    0
  );
  const focusSubmitted = focusWeek
    ? groups.reduce((sum, group) => sum + countValidSubmissions(group, new Set([focusWeek.id])), 0)
    : 0;

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-primary">Assessment dashboard</p>
        <h2 className="mt-1 text-2xl font-bold">Group progress overview</h2>
        <p className="mt-1 text-sm text-brand-muted">Submission progress is measured across weeks that have opened so far.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Groups" value={groups.length.toString()} detail={`${totalStudents} enrolled students`} />
        <Metric label="Progress to date" value={`${overallProgress}%`} detail={`${submittedToDate} of ${expectedToDate} submissions`} tone={overallProgress >= 80 ? "good" : "neutral"} />
        <Metric label={focusWeek ? `Week ${focusWeek.weekNumber}` : "Current week"} value={focusWeek ? `${focusSubmitted}/${totalStudents}` : "—"} detail={focusWeek ? "students submitted" : "No week has opened"} />
        <Metric label="Overdue" value={overdueMissing.toString()} detail={overdueMissing === 1 ? "missing submission" : "missing submissions"} tone={overdueMissing > 0 ? "warning" : "good"} />
      </div>

      <div className="overflow-hidden rounded-xl border border-brand-border bg-brand-surface shadow-soft">
        <div className="flex flex-col justify-between gap-2 border-b border-brand-border px-5 py-4 sm:flex-row sm:items-center">
          <div><h3 className="text-lg font-bold">Progress by group</h3><p className="mt-1 text-sm text-brand-muted">Completion across {openedWeeks.length} opened {openedWeeks.length === 1 ? "week" : "weeks"}.</p></div>
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-brand-muted"><Legend colour="bg-emerald-500" text="Complete" /><Legend colour="bg-amber-400" text="Partial" /><Legend colour="bg-slate-200" text="No submissions" /></div>
        </div>

        {groups.length === 0 ? (
          <div className="p-8 text-center text-sm text-brand-muted">Create a group to start tracking student progress.</div>
        ) : (
          <div className="divide-y divide-brand-border">
            {groups.map((group) => {
              const expected = group.members.length * openedWeeks.length;
              const submitted = countValidSubmissions(group, new Set(openedWeeks.map((week) => week.id)));
              const progress = percentage(submitted, expected);
              const focusCount = focusWeek ? countValidSubmissions(group, new Set([focusWeek.id])) : 0;
              return (
                <article key={group.id} className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(180px,1fr)_minmax(220px,1.4fr)_minmax(260px,1.5fr)] lg:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h4 className="font-bold">{group.name}</h4>{group.educatorName === currentEducatorName && <span className="rounded-full bg-brand-background px-2 py-1 text-[11px] font-semibold text-brand-primary">Assigned to you</span>}</div>
                    <p className="mt-1 text-xs text-brand-muted">{group.className} · {group.members.length} {group.members.length === 1 ? "student" : "students"}</p>
                    {group.educatorName && <p className="mt-1 text-xs text-brand-muted">Educator: {group.educatorName}</p>}
                  </div>

                  <div>
                    <div className="mb-2 flex items-end justify-between gap-3"><span className="text-sm font-semibold">{progress}% complete</span><span className="text-xs text-brand-muted">{submitted}/{expected} to date</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label={`${group.name} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className={`h-full rounded-full ${progress === 100 ? "bg-emerald-500" : "bg-brand-primary"}`} style={{ width: `${progress}%` }} /></div>
                    <p className="mt-2 text-xs text-brand-muted">{focusWeek ? `Week ${focusWeek.weekNumber}: ${focusCount}/${group.members.length} submitted` : "Waiting for the first week to open"}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {weeks.map((week) => {
                      const count = countValidSubmissions(group, new Set([week.id]));
                      const upcoming = week.opensAt > now;
                      const state = upcoming ? "upcoming" : count === group.members.length && group.members.length > 0 ? "complete" : count > 0 ? "partial" : "empty";
                      return <div key={week.id} title={`Week ${week.weekNumber}: ${upcoming ? "upcoming" : `${count}/${group.members.length} submitted`}`} className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-xs font-bold ${weekStyle(state)}`}>W{week.weekNumber}</div>;
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function countValidSubmissions(group: ProgressGroup, weekIds: Set<string>) {
  const memberIds = new Set(group.members.map((member) => member.studentId));
  return new Set(group.submissions.filter((submission) => weekIds.has(submission.assessmentWeekId) && memberIds.has(submission.submittedByStudentId)).map((submission) => `${submission.assessmentWeekId}:${submission.submittedByStudentId}`)).size;
}

function percentage(value: number, total: number) { return total === 0 ? 0 : Math.round((value / total) * 100); }
function weekStyle(state: "upcoming" | "complete" | "partial" | "empty") {
  if (state === "complete") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (state === "partial") return "border-amber-200 bg-amber-50 text-amber-700";
  if (state === "upcoming") return "border-dashed border-slate-200 bg-white text-slate-400";
  return "border-slate-200 bg-slate-50 text-slate-500";
}
function Metric({ label, value, detail, tone = "neutral" }: { label: string; value: string; detail: string; tone?: "neutral" | "good" | "warning" }) {
  const colour = tone === "good" ? "text-emerald-700" : tone === "warning" ? "text-amber-700" : "text-brand-text";
  return <div className="rounded-xl border border-brand-border bg-brand-surface p-5 shadow-soft"><p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{label}</p><p className={`mt-2 text-3xl font-bold ${colour}`}>{value}</p><p className="mt-1 text-xs text-brand-muted">{detail}</p></div>;
}
function Legend({ colour, text }: { colour: string; text: string }) { return <span className="flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-full ${colour}`} />{text}</span>; }
