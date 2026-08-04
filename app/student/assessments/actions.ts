"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SubmissionInput = {
  assessmentId: string;
  groupId: string;
  weekId: string;
  scores: { studentId: string; points: number }[];
  feedback: { studentId: string; comment: string }[];
};

export async function submitStudentAssessment(input: SubmissionInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const student = await requireStudent();
  const membership = await prisma.groupMember.findFirst({
    where: { studentId: student.id, groupId: input.groupId, group: { class: { assessmentId: input.assessmentId } } },
    include: { group: { include: { members: true } } },
  });
  if (!membership) return { ok: false, error: "You are not a member of this assessment group." };

  const week = await prisma.assessmentWeek.findFirst({ where: { id: input.weekId, assessmentId: input.assessmentId } });
  if (!week) return { ok: false, error: "This assessment week could not be found." };
  const now = new Date();
  if (week.locked || now < week.opensAt || now > week.dueAt) return { ok: false, error: "This submission window is not open." };

  const memberIds = membership.group.members.map((member) => member.studentId).sort();
  const scoreIds = input.scores.map((score) => score.studentId).sort();
  const feedbackIds = input.feedback.map((item) => item.studentId).sort();
  if (new Set(scoreIds).size !== memberIds.length || memberIds.some((id, index) => id !== scoreIds[index])) return { ok: false, error: "Scores must be provided once for every group member." };
  if (new Set(feedbackIds).size !== memberIds.length || memberIds.some((id, index) => id !== feedbackIds[index])) return { ok: false, error: "Feedback entries must match your current group." };
  if (input.scores.some((score) => !Number.isInteger(score.points) || score.points < 0 || score.points > 100) || input.scores.reduce((sum, score) => sum + score.points, 0) !== 100) return { ok: false, error: "Contribution points must be whole numbers totalling exactly 100." };
  if (input.feedback.some((item) => item.comment.length > 2000)) return { ok: false, error: "Each feedback response must be 2,000 characters or fewer." };

  try {
    const existingSubmission = await prisma.submission.findUnique({
      where: { assessmentWeekId_groupId_submittedByStudentId: { assessmentWeekId: week.id, groupId: membership.groupId, submittedByStudentId: student.id } },
      include: { scores: true },
    });
    const existingScoreIds = existingSubmission?.scores.map((score) => score.targetStudentId).sort() ?? [];
    const existingTotal = existingSubmission?.scores.reduce((sum, score) => sum + (score.educatorOverridePoints ?? score.points), 0) ?? 0;
    const existingComplete = Boolean(existingSubmission) && memberIds.length === existingScoreIds.length && memberIds.every((id, index) => id === existingScoreIds[index]) && existingTotal === 100;
    if (existingComplete) return { ok: false, error: "You have already submitted this week." };

    if (existingSubmission) {
      await prisma.$transaction([
        prisma.feedback.deleteMany({ where: { submissionId: existingSubmission.id } }),
        prisma.contributionScore.deleteMany({ where: { submissionId: existingSubmission.id } }),
        prisma.submission.update({
          where: { id: existingSubmission.id },
          data: {
            submittedAt: new Date(),
            scores: { create: input.scores.map((score) => ({ targetStudentId: score.studentId, points: score.points })) },
            feedback: { create: input.feedback.map((item) => ({ fromStudentId: student.id, toStudentId: item.studentId, comment: item.comment })) },
          },
        }),
      ]);
    } else {
      await prisma.submission.create({
        data: {
          assessmentWeekId: week.id,
          groupId: membership.groupId,
          submittedByStudentId: student.id,
          scores: { create: input.scores.map((score) => ({ targetStudentId: score.studentId, points: score.points })) },
          feedback: { create: input.feedback.map((item) => ({ fromStudentId: student.id, toStudentId: item.studentId, comment: item.comment })) },
        },
      });
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { ok: false, error: "You have already submitted this week." };
    console.error("Student submission failed", error);
    return { ok: false, error: "The submission could not be saved. Please try again." };
  }

  revalidatePath(`/student/assessments/${input.assessmentId}`);
  revalidatePath(`/educator/assessments/${input.assessmentId}`);
  return { ok: true };
}
