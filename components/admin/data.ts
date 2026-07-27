import { prisma } from "@/lib/prisma";

export const deadlineDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type AdminAssessment = Awaited<ReturnType<typeof getAssessments>>[number];
export type AdminAssessmentDetail = NonNullable<Awaited<ReturnType<typeof getAssessment>>>;
export type AdminEducator = Awaited<ReturnType<typeof getAssessmentEducators>>[number];

export async function getAssessments() {
  const assessments = await prisma.assessment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      educators: {
        where: { removedAt: null },
        select: { status: true },
      },
    },
  });

  return assessments.map((assessment) => ({
    ...assessment,
    assessmentWeighting: Number(assessment.assessmentWeighting),
    processWeighting: Number(assessment.processWeighting),
    educatorsInvited: assessment.educators.length,
    educatorsJoined: assessment.educators.filter((educator) => educator.status === "JOINED").length,
  }));
}

export async function getAssessment(assessmentId: string) {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    include: {
      educators: {
        where: { removedAt: null },
        select: { status: true },
      },
      _count: {
        select: { weeks: true },
      },
    },
  });

  if (!assessment) return null;

  return {
    ...assessment,
    assessmentWeighting: Number(assessment.assessmentWeighting),
    processWeighting: Number(assessment.processWeighting),
    educatorsInvited: assessment.educators.length,
    educatorsJoined: assessment.educators.filter((educator) => educator.status === "JOINED").length,
  };
}

export async function getAssessmentEducators(assessmentId: string) {
  return prisma.assessmentEducator.findMany({
    where: { assessmentId, removedAt: null },
    orderBy: { invitedAt: "desc" },
  });
}

export async function getUniversitySettings() {
  return prisma.universitySettings.findUnique({ where: { id: "default" } });
}

export function formatSchedule(assessment: Pick<AdminAssessmentDetail, "repeatType" | "deadlineDay" | "deadlineTime">) {
  const repeat = assessment.repeatType === "WEEKLY" ? "Weekly" : "Fortnightly";
  const day = assessment.deadlineDay.toLowerCase().replace(/^\w/, (character) => character.toUpperCase());
  return `${repeat}, ${day} at ${assessment.deadlineTime}`;
}

export function processOverallWeight(assessment: Pick<AdminAssessmentDetail, "assessmentWeighting" | "processWeighting">) {
  return (assessment.assessmentWeighting * assessment.processWeighting) / 100;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}
