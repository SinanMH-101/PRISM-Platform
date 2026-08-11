import Link from "next/link";
import { formatSchedule, getAssessments } from "@/components/admin/data";

const statusStyles = {
  DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLOSED: "bg-slate-100 text-slate-700 border-slate-200",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string | string[]; status?: string | string[] }>;
}) {
  const params = await searchParams;
  const query = typeof params.query === "string" ? params.query.trim() : "";
  const requestedStatus = typeof params.status === "string" ? params.status.toUpperCase() : "";
  const status = (["DRAFT", "ACTIVE", "CLOSED"] as const).find((value) => value === requestedStatus);
  const assessments = await getAssessments({ query, status });
  const filtersApplied = Boolean(query || status);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold text-brand-primary">Admin</p>
          <h1 className="mt-1 text-3xl font-bold">Home</h1>
        </div>
        <Link href="/admin/assessments/new" className="focus-ring rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
          Create New Assessment
        </Link>
      </section>

      <form action="/admin" className="flex flex-col gap-3 rounded-lg border border-brand-border bg-brand-surface p-4 shadow-soft md:flex-row md:items-end">
        <label className="flex-1 text-sm font-semibold text-brand-muted">
          Search assessments
          <input
            type="search"
            name="query"
            defaultValue={query}
            placeholder="Search by name, unit code, or semester"
            className="focus-ring mt-2 w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-brand-text"
          />
        </label>
        <label className="text-sm font-semibold text-brand-muted md:w-48">
          Status
          <select name="status" defaultValue={status ?? ""} className="focus-ring mt-2 w-full rounded-lg border border-brand-border bg-white px-3 py-2 text-brand-text">
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>
        <button className="focus-ring rounded-lg bg-brand-primary px-4 py-2 font-semibold text-white hover:opacity-90">Apply filters</button>
        {filtersApplied && (
          <Link href="/admin" className="focus-ring rounded-lg border border-brand-border bg-brand-surface px-4 py-2 text-center font-semibold hover:border-brand-primary hover:bg-brand-primary hover:text-white">
            Clear
          </Link>
        )}
      </form>

      <section className="grid gap-4 lg:grid-cols-2">
        {assessments.length === 0 && (
          <div className="rounded-lg border border-brand-border bg-brand-surface p-8 text-center shadow-soft">
            <p className="font-semibold">{filtersApplied ? "No matching assessments." : "No assessments yet."}</p>
            <p className="mt-1 text-sm text-brand-muted">
              {filtersApplied ? "Try changing or clearing the search filters." : "Create the first assessment to get started."}
            </p>
          </div>
        )}
        {assessments.map((assessment) => (
          <article key={assessment.id} className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold text-brand-primary">{assessment.unitCode}</p>
                <h2 className="mt-1 text-2xl font-bold">{assessment.name}</h2>
                <p className="mt-1 text-sm font-semibold text-brand-muted">{assessment.semester}</p>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-xs font-bold capitalize ${statusStyles[assessment.status]}`}>
                {assessment.status.toLowerCase()}
              </span>
            </div>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
              <Stat label="Assessment weighting" value={`${assessment.assessmentWeighting}%`} />
              <Stat label="Process/team weighting" value={`${assessment.processWeighting}%`} />
              <Stat label="TAs invited" value={assessment.educatorsInvited.toString()} />
              <Stat label="TAs joined" value={assessment.educatorsJoined.toString()} />
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
