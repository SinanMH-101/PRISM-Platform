import Link from "next/link";
import { notFound } from "next/navigation";
import NewAssessmentForm from "@/components/admin/NewAssessmentForm";
import { getAssessment } from "@/components/admin/data";
import { prisma } from "@/lib/prisma";

export default async function EditAssessmentPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  const assessment = await getAssessment(assessmentId);
  if (!assessment) notFound();
  const latestSubmittedWeek = await prisma.assessmentWeek.findFirst({
    where: { assessmentId, submissions: { some: {} } },
    orderBy: { weekNumber: "desc" },
    select: { weekNumber: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/assessments/${assessment.id}`} className="focus-ring text-sm font-semibold text-brand-primary">Back to assessment</Link>
        <h1 className="mt-3 text-3xl font-bold">Edit assessment</h1>
        <p className="mt-2 max-w-3xl text-sm text-brand-muted">Update assessment details, group defaults, staffing, deadlines, and feedback visibility.</p>
      </div>
      <NewAssessmentForm assessment={assessment} minimumWeeks={latestSubmittedWeek?.weekNumber ?? 1} />
    </div>
  );
}
