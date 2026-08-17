import Link from "next/link";
import { notFound } from "next/navigation";
import AdminGroupOverview from "@/components/admin/AdminGroupOverview";
import EducatorAssessmentViews from "@/components/educator/EducatorAssessmentViews";
import EducatorProgressDashboard from "@/components/educator/EducatorProgressDashboard";
import GroupSubmissionView from "@/components/educator/GroupSubmissionView";
import { prisma } from "@/lib/prisma";
import { finaliseOverdueSubmissions } from "@/lib/overdue-submissions";

export default async function AdminAssessmentWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ assessmentId: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const { assessmentId } = await params;
  const requestedView = (await searchParams).view;
  const initialView = requestedView === "dashboard" || requestedView === "groupView" || requestedView === "groups" ? requestedView : "groups";
  await finaliseOverdueSubmissions(assessmentId);
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
    include: {
      weeks: { orderBy: { weekNumber: "asc" } },
      classes: {
        include: {
          groups: {
            include: {
              educator: { select: { name: true } },
              members: { include: { student: true }, orderBy: { student: { name: "asc" } } },
              submissions: {
                include: {
                  assessmentWeek: { select: { weekNumber: true } },
                  submittedBy: { select: { id: true, name: true } },
                  scores: { include: { targetStudent: { select: { name: true } } } },
                  feedback: { include: { toStudent: { select: { name: true } } } },
                },
                orderBy: [{ assessmentWeek: { weekNumber: "desc" } }, { submittedBy: { name: "asc" } }],
              },
            },
            orderBy: { name: "asc" },
          },
        },
      },
    },
  });
  if (!assessment) notFound();

  const groups = assessment.classes.flatMap((assessmentClass) =>
    assessmentClass.groups.map((group) => ({ ...group, className: assessmentClass.name }))
  );

  return (
    <div>
      <div className="px-5 pt-2">
        <Link href={`/admin/assessments/${assessment.id}`} className="focus-ring inline-flex rounded-lg border border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold hover:border-brand-primary hover:bg-brand-primary hover:text-white">Back to assessment setup</Link>
        <p className="mt-3 text-sm font-semibold text-brand-primary">Admin oversight · {assessment.unitCode}</p>
        <h1 className="mt-1 text-3xl font-bold">{assessment.name}</h1>
      </div>
      <EducatorAssessmentViews
        initialView={initialView}
        sidebar={<section className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft"><p className="text-sm font-semibold text-brand-primary">{assessment.unitCode}</p><h2 className="mt-1 text-2xl font-bold">{assessment.name}</h2><div className="mt-5 grid gap-3 text-sm"><div className="rounded-lg bg-brand-background p-3"><p className="font-semibold">Students per group</p><p className="mt-1 text-brand-muted">{assessment.studentsPerGroup}</p></div><div className="rounded-lg bg-brand-background p-3"><p className="font-semibold">Groups created</p><p className="mt-1 text-brand-muted">{groups.length}</p></div></div></section>}
        groupManager={<AdminGroupOverview groups={groups} studentsPerGroup={assessment.studentsPerGroup} />}
        dashboard={<EducatorProgressDashboard currentEducatorName="" weeks={assessment.weeks} groups={groups.map((group) => ({ id: group.id, name: group.name, className: group.className, educatorName: group.educator?.name ?? null, members: group.members.map((member) => ({ studentId: member.studentId })), submissions: group.submissions.map((submission) => ({ ...submission, scores: submission.scores.map((score) => ({ ...score, points: Number(score.points), educatorOverridePoints: score.educatorOverridePoints === null ? null : Number(score.educatorOverridePoints) })) })) }))} />}
        groupView={<GroupSubmissionView readOnly assessmentId={assessment.id} weekNumbers={assessment.weeks.map((week) => week.weekNumber)} groups={groups.map((group) => ({ id: group.id, name: group.name, className: group.className, educatorName: group.educator?.name ?? null, members: group.members.map((member) => ({ id: member.student.id, name: member.student.name })), submissions: group.submissions.map((submission) => ({ id: submission.id, weekNumber: submission.assessmentWeek.weekNumber, submittedAt: submission.submittedAt.toISOString(), locked: submission.locked, submittedBy: submission.submittedBy, scores: submission.scores.map((score) => ({ targetStudentId: score.targetStudentId, targetStudentName: score.targetStudent.name, originalPoints: Number(score.points), points: Number(score.educatorOverridePoints ?? score.points), overridden: score.educatorOverridePoints !== null })), feedback: submission.feedback.map((item) => ({ toStudentId: item.toStudentId, toStudentName: item.toStudent.name, comment: item.comment })) })) }))} />}
      />
    </div>
  );
}
