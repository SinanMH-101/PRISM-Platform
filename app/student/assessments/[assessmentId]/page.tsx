import { notFound, redirect } from "next/navigation";
import StudentAssessmentPage, { StudentAssessmentData } from "@/components/StudentAssessmentPage";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function StudentAssessmentRoute({ params }: { params: Promise<{ assessmentId: string }> }) {
  const student = await requireStudent();
  if (student.mustChangePassword) redirect("/change-password");
  const { assessmentId } = await params;

  const membership = await prisma.groupMember.findFirst({
    where: { studentId: student.id, group: { class: { assessmentId } } },
    include: {
      group: {
        include: {
          class: { include: { assessment: { include: { weeks: { orderBy: { weekNumber: "asc" } } } } } },
          members: { include: { student: true }, orderBy: { student: { name: "asc" } } },
          submissions: {
            where: { submittedByStudentId: student.id, assessmentWeek: { assessmentId } },
            include: { scores: true, feedback: true },
          },
        },
      },
    },
  });
  if (!membership) notFound();

  const { group } = membership;
  const assessment = group.class.assessment;
  const submissions = new Map(group.submissions.map((submission) => [submission.assessmentWeekId, submission]));
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Australia/Sydney" });
  const data: StudentAssessmentData = {
    assessment: { id: assessment.id, name: assessment.name, unitCode: assessment.unitCode, semester: assessment.semester },
    className: group.class.name,
    group: { id: group.id, name: group.name },
    currentStudent: { id: student.id, name: student.name },
    members: group.members.map(({ student: member }) => ({ id: member.id, name: member.name, email: member.email, initials: member.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() })),
    weeks: assessment.weeks.map((week) => {
      const submission = submissions.get(week.id);
      const memberIds = group.members.map((member) => member.studentId).sort();
      const submittedScoreIds = submission?.scores.map((score) => score.targetStudentId).sort() ?? [];
      const effectiveTotal = submission?.scores.reduce((sum, score) => sum + (score.educatorOverridePoints ?? score.points), 0) ?? 0;
      const submissionComplete = Boolean(submission) && memberIds.length === submittedScoreIds.length && memberIds.every((id, index) => id === submittedScoreIds[index]) && effectiveTotal === 100;
      const status = submissionComplete ? "SUBMITTED" : week.locked || now > week.dueAt ? "LOCKED" : now < week.opensAt ? "UPCOMING" : "OPEN";
      return {
        id: week.id,
        number: week.weekNumber,
        due: formatter.format(week.dueAt),
        status,
        scores: submission ? Object.fromEntries(submission.scores.map((score) => [score.targetStudentId, score.educatorOverridePoints ?? score.points])) : null,
        scoreOverrides: submission ? Object.fromEntries(submission.scores.map((score) => [score.targetStudentId, score.educatorOverridePoints !== null])) : null,
        feedback: submission ? Object.fromEntries(submission.feedback.map((item) => [item.toStudentId, item.comment])) : null,
      };
    }),
  };
  return <StudentAssessmentPage data={data} />;
}
