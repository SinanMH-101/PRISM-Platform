import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatSchedule, getAssessment, processOverallWeight } from "@/components/admin/data";

export default async function AssessmentDetailPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  const assessment = await getAssessment(assessmentId);
  if (!assessment) notFound();

  const groups = Math.ceil(assessment.cohortSize / assessment.studentsPerGroup);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <Link href="/admin" className="focus-ring text-sm font-semibold text-brand-primary">
            Back to dashboard
          </Link>
          <p className="mt-3 text-sm font-semibold text-brand-primary">{assessment.unitCode}</p>
          <h1 className="mt-1 text-3xl font-bold">{assessment.name}</h1>
          <p className="mt-1 text-sm font-semibold text-brand-muted">{assessment.semester}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href={`/admin/assessments/${assessment.id}/edit`} className="focus-ring rounded-lg border border-brand-border px-4 py-3 text-sm font-semibold hover:bg-brand-background">Edit assessment</Link>
          <Link href={`/admin/assessments/${assessment.id}/workspace`} className="focus-ring rounded-lg border border-brand-primary px-4 py-3 text-sm font-semibold text-brand-primary hover:bg-brand-background">View Educator Dashboard</Link>
          <Link href={`/admin/assessments/${assessment.id}/educators`} className="focus-ring rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90">Manage educators</Link>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Stat label="Status" value={assessment.status} />
        <Stat label="Assessment weighting" value={`${assessment.assessmentWeighting}%`} />
        <Stat label="Process overall value" value={`${processOverallWeight(assessment)}%`} />
        <Stat label="Expected groups" value={groups.toString()} />
      </section>

      <section className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
        <h2 className="text-xl font-bold">Assessment setup</h2>
        <dl className="mt-5 grid gap-3 text-sm md:grid-cols-2">
          <Detail label="Process/team assessment weighting" value={`${assessment.processWeighting}% of this assessment`} />
          <Detail label="Semester" value={assessment.semester} />
          <Detail label="Cohort size" value={assessment.cohortSize.toString()} />
          <Detail label="Students per group" value={assessment.studentsPerGroup.toString()} />
          <Detail label="Number of educators" value={assessment.educatorCount.toString()} />
          <Detail label="Deadline schedule" value={formatSchedule(assessment)} />
          <Detail label="Weeks and start date" value={`${assessment.numberOfWeeks} weeks from ${formatDate(assessment.startDate)}`} />
          <Detail
            label="Feedback visibility"
            value={
              assessment.feedbackVisibility === "IMMEDIATE_AFTER_SUBMISSION"
                ? "Students see peer feedback immediately after submitting"
                : "Students see peer feedback only after the weekly deadline"
            }
          />
          <Detail label="Educator progress" value={`${assessment.educatorsJoined}/${assessment.educatorsInvited} joined`} />
        </dl>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase text-brand-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold capitalize">{value.toLowerCase()}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-brand-background p-3">
      <dt className="font-semibold">{label}</dt>
      <dd className="mt-1 text-brand-muted">{value}</dd>
    </div>
  );
}
