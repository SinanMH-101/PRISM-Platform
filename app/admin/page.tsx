import Link from "next/link";
import { assessments, formatSchedule } from "@/components/admin/data";

const statusStyles = {
  draft: "bg-amber-50 text-amber-700 border-amber-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-slate-100 text-slate-700 border-slate-200",
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-primary">Admin</p>
          <h1 className="mt-1 text-3xl font-bold">Admin Dashboard</h1>
        </div>
        <Link href="/admin/assessments/new" className="focus-ring rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
          Create New Assessment
        </Link>
      </section>

      <label className="block max-w-md text-sm font-semibold text-brand-muted">
        Assessment search/filter later
        <input disabled placeholder="Search is coming later" className="mt-2 w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-brand-muted" />
      </label>

      <section className="grid gap-4 lg:grid-cols-2">
        {assessments.map((assessment) => (
          <article key={assessment.id} className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold text-brand-primary">{assessment.unitCode}</p>
                <h2 className="mt-1 text-2xl font-bold">{assessment.name}</h2>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusStyles[assessment.status]}`}>
                {assessment.status}
              </span>
            </div>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Stat label="Assessment weighting" value={`${assessment.assessmentWeighting}%`} />
              <Stat label="Process/team weighting" value={`${assessment.processWeighting}%`} />
              <Stat label="Educators invited" value={assessment.educatorsInvited.toString()} />
              <Stat label="Educators joined" value={assessment.educatorsJoined.toString()} />
              <Stat label="Cohort size" value={assessment.cohortSize.toString()} />
              <Stat label="Deadline schedule" value={formatSchedule(assessment)} />
            </dl>

            <div className="mt-5 flex justify-end">
              <Link href={`/admin/assessments/${assessment.id}`} className="focus-ring rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold hover:bg-brand-background">
                View details
              </Link>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-brand-background p-3">
      <dt className="text-xs font-semibold uppercase text-brand-muted">{label}</dt>
      <dd className="mt-1 font-bold">{value}</dd>
    </div>
  );
}
