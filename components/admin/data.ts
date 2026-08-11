import { prisma } from "@/lib/prisma";

export const deadlineDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export type AdminAssessment = Awaited<ReturnType<typeof getAssessments>>[number];
export type AdminAssessmentDetail = NonNullable<Awaited<ReturnType<typeof getAssessment>>>;
export type AdminEducator = Awaited<ReturnType<typeof getAssessmentEducators>>[number];

export async function getAssessments(filters: { query?: string; status?: "DRAFT" | "ACTIVE" | "CLOSED" } = {}) {
  const query = filters.query?.trim();
  const assessments = await prisma.assessment.findMany({
    where: {
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(query
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { unitCode: { contains: query, mode: "insensitive" } },
              { semester: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
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
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
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
  const settings = await prisma.universitySettings.findUnique({ where: { id: "default" } });
  if (!settings) return null;
  const nightSettings = settings as typeof settings & {
    nightPrimaryColour?: string;
    nightSecondaryColour?: string;
    nightAccentColour?: string;
  };
  return {
    ...settings,
    nightPrimaryColour: nightSettings.nightPrimaryColour ?? "#7dd3fc",
    nightSecondaryColour: nightSettings.nightSecondaryColour ?? "#94a3b8",
    nightAccentColour: nightSettings.nightAccentColour ?? "#2dd4bf",
  };
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
