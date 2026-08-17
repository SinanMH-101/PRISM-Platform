import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Materialises default submissions for students who missed an assessment deadline.
 * The unique submission constraint makes this safe to run repeatedly or concurrently.
 */
export async function finaliseOverdueSubmissions(assessmentId: string, now = new Date()) {
  const overdueWeeks = await prisma.assessmentWeek.findMany({
    where: { assessmentId, dueAt: { lte: now }, assessment: { deletedAt: null } },
    select: { id: true, dueAt: true },
  });
  if (overdueWeeks.length === 0) return 0;

  const weekIds = overdueWeeks.map((week) => week.id);
  const dueAtByWeekId = new Map(overdueWeeks.map((week) => [week.id, week.dueAt]));
  const groups = await prisma.group.findMany({
    where: { class: { assessmentId, assessment: { deletedAt: null } } },
    select: {
      id: true,
      members: { select: { studentId: true } },
      submissions: {
        where: { assessmentWeekId: { in: weekIds } },
        select: { assessmentWeekId: true, submittedByStudentId: true },
      },
    },
  });

  let created = 0;
  for (const group of groups) {
    const memberIds = group.members.map((member) => member.studentId);
    if (memberIds.length < 2) continue;

    const submittedKeys = new Set(group.submissions.map((submission) => `${submission.assessmentWeekId}:${submission.submittedByStudentId}`));
    for (const weekId of weekIds) {
      for (const missingStudentId of memberIds) {
        if (submittedKeys.has(`${weekId}:${missingStudentId}`)) continue;

        const teammateShare = 100 / (memberIds.length - 1);
        try {
          await prisma.submission.create({
            data: {
              assessmentWeekId: weekId,
              groupId: group.id,
              submittedByStudentId: missingStudentId,
              submittedAt: dueAtByWeekId.get(weekId),
              locked: true,
              scores: {
                create: memberIds.map((targetStudentId) => ({
                  targetStudentId,
                  points: targetStudentId === missingStudentId ? 0 : teammateShare,
                })),
              },
            },
          });
          submittedKeys.add(`${weekId}:${missingStudentId}`);
          created += 1;
        } catch (error) {
          if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
        }
      }
    }
  }

  return created;
}
