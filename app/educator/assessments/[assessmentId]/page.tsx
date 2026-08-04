import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireEducator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GroupManager from "@/components/educator/GroupManager";
import EducatorProgressDashboard from "@/components/educator/EducatorProgressDashboard";
import EducatorAssessmentViews from "@/components/educator/EducatorAssessmentViews";
import GroupSubmissionView from "@/components/educator/GroupSubmissionView";
import { educatorLogoutAction } from "../../actions";

export default async function EducatorAssessmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ assessmentId: string }>;
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const educator = await requireEducator();
  if (educator.mustChangePassword) redirect("/change-password");

  const { assessmentId } = await params;
  const requestedView = (await searchParams).view;
  const initialView = requestedView === "dashboard" || requestedView === "groupView" || requestedView === "groups" ? requestedView : "groups";
  const invite = await prisma.assessmentEducator.findFirst({
    where: {
      assessmentId,
      userId: educator.id,
      status: "JOINED",
      removedAt: null,
    },
    include: {
      assessment: {
        include: {
          weeks: { orderBy: { weekNumber: "asc" } },
          classes: {
            include: {
              groups: {
                include: {
                  educator: { select: { name: true } },
                  members: {
                    include: { student: true },
                    orderBy: { student: { name: "asc" } },
                  },
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
      },
    },
  });

  if (!invite) notFound();

  const assessment = invite.assessment;
  const groups = assessment.classes.flatMap((assessmentClass) =>
    assessmentClass.groups.map((group) => ({ ...group, className: assessmentClass.name }))
  );
  return (
    <main className="min-h-screen bg-brand-background text-brand-text">
      <nav className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Educator workspace</p>
            <p className="text-xs text-brand-muted">Signed in as {educator.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/educator" className="focus-ring rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold hover:bg-brand-background">
              Back to assessments
            </Link>
            <form action={educatorLogoutAction}>
              <button className="focus-ring rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold hover:bg-brand-background">Log out</button>
            </form>
          </div>
        </div>
      </nav>

      <EducatorAssessmentViews
        initialView={initialView}
        sidebar={
          <section className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
            <p className="text-sm font-semibold text-brand-primary">{assessment.unitCode}</p>
            <h1 className="mt-1 text-3xl font-bold">{assessment.name}</h1>
            <p className="mt-1 text-sm text-brand-muted">{assessment.semester}</p>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-lg bg-brand-background p-3">
                <p className="font-semibold">Students per group</p>
                <p className="mt-1 text-brand-muted">{assessment.studentsPerGroup}</p>
              </div>
              <div className="rounded-lg bg-brand-background p-3">
                <p className="font-semibold">Groups created</p>
                <p className="mt-1 text-brand-muted">{groups.length}</p>
              </div>
            </div>
          </section>
        }
        dashboard={
          <EducatorProgressDashboard
            currentEducatorName={educator.name}
            weeks={assessment.weeks}
            groups={groups.map((group) => ({
              id: group.id,
              name: group.name,
              className: group.className,
              educatorName: group.educator?.name ?? null,
              members: group.members.map((member) => ({ studentId: member.studentId })),
              submissions: group.submissions,
            }))}
          />
        }
        groupManager={
          <GroupManager assessmentId={assessment.id} studentsPerGroup={assessment.studentsPerGroup} groups={groups} />
        }
        groupView={
          <GroupSubmissionView
            assessmentId={assessment.id}
            weekNumbers={assessment.weeks.map((week) => week.weekNumber)}
            groups={groups.map((group) => ({
              id: group.id,
              name: group.name,
              className: group.className,
              educatorName: group.educator?.name ?? null,
              members: group.members.map((member) => ({ id: member.student.id, name: member.student.name })),
              submissions: group.submissions.map((submission) => ({
                id: submission.id,
                weekNumber: submission.assessmentWeek.weekNumber,
                submittedAt: submission.submittedAt.toISOString(),
                submittedBy: submission.submittedBy,
                scores: submission.scores.map((score) => ({
                  targetStudentId: score.targetStudentId,
                  targetStudentName: score.targetStudent.name,
                  originalPoints: score.points,
                  points: score.educatorOverridePoints ?? score.points,
                  overridden: score.educatorOverridePoints !== null,
                })),
                feedback: submission.feedback.map((item) => ({ toStudentId: item.toStudentId, toStudentName: item.toStudent.name, comment: item.comment })),
              })),
            }))}
          />
        }
      />
    </main>
  );
}
