import Link from "next/link";
import { notFound } from "next/navigation";
import EducatorInvitePanel from "@/components/admin/EducatorInvitePanel";
import { getAssessment, getAssessmentEducators } from "@/components/admin/data";

export default async function AssessmentEducatorsPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  const assessment = getAssessment(assessmentId);
  if (!assessment) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/assessments/${assessment.id}`} className="focus-ring text-sm font-semibold text-brand-primary">
          Back to assessment details
        </Link>
        <p className="mt-3 text-sm font-semibold text-brand-primary">{assessment.unitCode}</p>
        <h1 className="mt-1 text-3xl font-bold">Educator allocation</h1>
        <p className="mt-2 max-w-3xl text-sm text-brand-muted">
          Add educators by pasted emails, CSV upload, or manually-created accounts, then track invitation status.
        </p>
      </div>
      <EducatorInvitePanel initialEducators={getAssessmentEducators(assessment.id)} />
    </div>
  );
}
