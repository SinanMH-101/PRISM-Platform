"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSession, requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { inviteEducatorsToAssessment, isValidEmail, splitEducatorEmails, type InviteEmailPreview } from "@/lib/invites";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export type EducatorInviteActionState = {
  error?: string;
  message?: string;
  previews: InviteEmailPreview[];
};

function inviteActionState(result: Awaited<ReturnType<typeof inviteEducatorsToAssessment>>): EducatorInviteActionState {
  if (result.failed.length > 0) {
    return {
      error: `${result.failed.length} invitation${result.failed.length === 1 ? "" : "s"} could not be sent. ${result.failed[0].error}`,
      previews: result.previews,
    };
  }

  return {
    message:
      result.deliveryMode === "brevo"
        ? `${result.sent} invitation${result.sent === 1 ? "" : "s"} sent through Brevo.`
        : "Brevo is not configured, so no email was sent. Preview mode is active.",
    previews: result.previews,
  };
}

function enumValue(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toUpperCase().replaceAll("-", "_");
}

function numberValue(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildDueDate(startDate: string, deadlineDay: string, deadlineTime: string, index: number, repeatType: string) {
  const dayIndex = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"].indexOf(deadlineDay);
  const date = new Date(`${startDate}T00:00:00`);
  const currentDay = date.getDay();
  const offset = (dayIndex - currentDay + 7) % 7;
  date.setDate(date.getDate() + offset + index * (repeatType === "FORTNIGHTLY" ? 14 : 7));

  const [hours, minutes] = deadlineTime.split(":").map(Number);
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

function buildOpenDate(startDate: string, deadlineDay: string, deadlineTime: string, index: number, repeatType: string) {
  return index === 0
    ? new Date(`${startDate}T00:00:00`)
    : buildDueDate(startDate, deadlineDay, deadlineTime, index - 1, repeatType);
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function createAssessmentAction(formData: FormData) {
  await requireAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const unitCode = String(formData.get("unitCode") ?? "").trim().toUpperCase();
  const semesterYear = Number(formData.get("semesterYear"));
  const semesterPeriod = String(formData.get("semesterPeriod") ?? "").toUpperCase();
  if (!name || !unitCode || !Number.isInteger(semesterYear) || !["S1", "S2"].includes(semesterPeriod)) return;

  const repeatType = enumValue(formData.get("repeatType")) || "WEEKLY";
  const deadlineDay = enumValue(formData.get("deadlineDay")) || "SUNDAY";
  const deadlineTime = String(formData.get("deadlineTime") ?? "23:55");
  const numberOfWeeks = numberValue(formData.get("weeks"), 13);
  const startDateValue = String(formData.get("startDate") ?? new Date().toISOString().slice(0, 10));

  const assessment = await prisma.assessment.create({
    data: {
      name,
      unitCode,
      semester: `${semesterYear} ${semesterPeriod}`,
      assessmentWeighting: numberValue(formData.get("assessmentWeighting"), 0),
      processWeighting: numberValue(formData.get("processWeighting"), 0),
      cohortSize: numberValue(formData.get("cohortSize"), 0),
      studentsPerGroup: Math.max(1, numberValue(formData.get("studentsPerGroup"), 1)),
      educatorCount: numberValue(formData.get("educatorCount"), 0),
      repeatType: repeatType as "WEEKLY" | "FORTNIGHTLY",
      deadlineDay: deadlineDay as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
      deadlineTime,
      numberOfWeeks,
      startDate: new Date(`${startDateValue}T00:00:00`),
      feedbackVisibility:
        enumValue(formData.get("feedbackVisibility")) === "IMMEDIATE"
          ? "IMMEDIATE_AFTER_SUBMISSION"
          : (enumValue(formData.get("feedbackVisibility")) as "IMMEDIATE_AFTER_SUBMISSION" | "AFTER_DEADLINE"),
      status: "DRAFT",
      weeks: {
        create: Array.from({ length: numberOfWeeks }, (_, index) => ({
          weekNumber: index + 1,
          opensAt: buildOpenDate(startDateValue, deadlineDay, deadlineTime, index, repeatType),
          dueAt: buildDueDate(startDateValue, deadlineDay, deadlineTime, index, repeatType),
        })),
      },
    },
  });

  revalidatePath("/admin");
  redirect(`/admin/assessments/${assessment.id}/educators`);
}

export async function updateAssessmentAction(formData: FormData) {
  await requireAdmin();

  const assessmentId = String(formData.get("assessmentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const unitCode = String(formData.get("unitCode") ?? "").trim().toUpperCase();
  const semesterYear = Number(formData.get("semesterYear"));
  const semesterPeriod = String(formData.get("semesterPeriod") ?? "").toUpperCase();
  const repeatType = enumValue(formData.get("repeatType"));
  const deadlineDay = enumValue(formData.get("deadlineDay"));
  const deadlineTime = String(formData.get("deadlineTime") ?? "");
  const numberOfWeeks = numberValue(formData.get("weeks"), 0);
  const startDateValue = String(formData.get("startDate") ?? "");
  const existingAssessment = await prisma.assessment.findFirst({ where: { id: assessmentId, deletedAt: null }, select: { feedbackVisibility: true } });
  if (!existingAssessment) return;
  const feedbackVisibility = enumValue(formData.get("feedbackVisibility")) || existingAssessment.feedbackVisibility;
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(startDateValue) && !Number.isNaN(new Date(`${startDateValue}T00:00:00`).valueOf());

  if (
    !assessmentId || !name || !unitCode || !Number.isInteger(semesterYear) ||
    !["S1", "S2"].includes(semesterPeriod) || !["WEEKLY", "FORTNIGHTLY"].includes(repeatType) ||
    !["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"].includes(deadlineDay) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(deadlineTime) || !Number.isInteger(numberOfWeeks) || numberOfWeeks < 1 || numberOfWeeks > 100 ||
    !validDate || !["IMMEDIATE_AFTER_SUBMISSION", "AFTER_DEADLINE"].includes(feedbackVisibility)
  ) return;

  const weeks = await prisma.assessmentWeek.findMany({
    where: { assessmentId },
    orderBy: { weekNumber: "asc" },
    include: { _count: { select: { submissions: true } } },
  });
  const weeksToRemove = weeks.filter((week) => week.weekNumber > numberOfWeeks);
  if (weeksToRemove.some((week) => week._count.submissions > 0)) return;

  const assessmentWeighting = numberValue(formData.get("assessmentWeighting"), 0);
  const processWeighting = numberValue(formData.get("processWeighting"), 0);
  const cohortSize = numberValue(formData.get("cohortSize"), 0);
  const studentsPerGroup = numberValue(formData.get("studentsPerGroup"), 1);
  const educatorCount = numberValue(formData.get("educatorCount"), 0);
  if ([assessmentWeighting, processWeighting].some((value) => value < 0 || value > 100) ||
      ![cohortSize, studentsPerGroup, educatorCount].every((value) => Number.isInteger(value) && value >= 0) || studentsPerGroup < 1) return;

  await prisma.$transaction(async (transaction) => {
    await transaction.assessment.update({
      where: { id: assessmentId },
      data: {
        name,
        unitCode,
        semester: `${semesterYear} ${semesterPeriod}`,
        assessmentWeighting,
        processWeighting,
        cohortSize,
        studentsPerGroup,
        educatorCount,
        repeatType: repeatType as "WEEKLY" | "FORTNIGHTLY",
        deadlineDay: deadlineDay as "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY",
        deadlineTime,
        numberOfWeeks,
        startDate: new Date(`${startDateValue}T00:00:00`),
        feedbackVisibility: feedbackVisibility as "IMMEDIATE_AFTER_SUBMISSION" | "AFTER_DEADLINE",
      },
    });

    for (let index = 0; index < numberOfWeeks; index += 1) {
      const weekNumber = index + 1;
      await transaction.assessmentWeek.upsert({
        where: { assessmentId_weekNumber: { assessmentId, weekNumber } },
        update: {
          opensAt: buildOpenDate(startDateValue, deadlineDay, deadlineTime, index, repeatType),
          dueAt: buildDueDate(startDateValue, deadlineDay, deadlineTime, index, repeatType),
        },
        create: {
          assessmentId,
          weekNumber,
          opensAt: buildOpenDate(startDateValue, deadlineDay, deadlineTime, index, repeatType),
          dueAt: buildDueDate(startDateValue, deadlineDay, deadlineTime, index, repeatType),
        },
      });
    }
    if (weeksToRemove.length > 0) {
      await transaction.assessmentWeek.deleteMany({ where: { id: { in: weeksToRemove.map((week) => week.id) } } });
    }
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/assessments/${assessmentId}`);
  revalidatePath(`/admin/assessments/${assessmentId}/workspace`);
  revalidatePath(`/educator/assessments/${assessmentId}`);
  redirect(`/admin/assessments/${assessmentId}`);
}

export async function deleteAssessmentAction(formData: FormData) {
  await requireAdmin();

  const assessmentId = String(formData.get("assessmentId") ?? "");
  if (!assessmentId) return;

  await prisma.assessment.updateMany({
    where: { id: assessmentId, deletedAt: null },
    data: { deletedAt: new Date(), status: "CLOSED" },
  });

  revalidatePath("/admin");
  revalidatePath("/educator");
  revalidatePath("/student/dashboard");
  redirect("/admin");
}

export async function invitePastedEducatorsAction(_previousState: EducatorInviteActionState, formData: FormData): Promise<EducatorInviteActionState> {
  await requireAdmin();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const emails = splitEducatorEmails(String(formData.get("emails") ?? ""));

  if (emails.length === 0) {
    return { error: "Paste at least one valid email address.", previews: [] };
  }

  const result = await inviteEducatorsToAssessment(assessmentId, emails);
  revalidatePath(`/admin/assessments/${assessmentId}/educators`);
  return inviteActionState(result);
}

export async function uploadEducatorCsvAction(_previousState: EducatorInviteActionState, formData: FormData): Promise<EducatorInviteActionState> {
  await requireAdmin();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const file = formData.get("csv");
  if (!(file instanceof File)) return { error: "Choose a CSV file first.", previews: [] };

  const emails = splitEducatorEmails(await file.text());
  if (emails.length === 0) {
    return { error: "The CSV did not contain any valid email addresses.", previews: [] };
  }

  const result = await inviteEducatorsToAssessment(assessmentId, emails);
  revalidatePath(`/admin/assessments/${assessmentId}/educators`);
  return inviteActionState(result);
}

export async function createEducatorAccountAction(_previousState: EducatorInviteActionState, formData: FormData): Promise<EducatorInviteActionState> {
  await requireAdmin();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!name || !isValidEmail(email)) return { error: "Enter a valid TA name and email.", previews: [] };

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "EDUCATOR",
      ...(password ? { passwordHash: await hashPassword(password), mustChangePassword: true } : {}),
    },
    create: {
      name,
      email,
      username: email,
      role: "EDUCATOR",
      passwordHash: password ? await hashPassword(password) : null,
      mustChangePassword: Boolean(password),
    },
  });

  await prisma.assessmentEducator.upsert({
    where: { assessmentId_email: { assessmentId, email } },
    update: { name, userId: user.id, status: "INVITED", removedAt: null },
    create: { assessmentId, userId: user.id, name, email, status: "INVITED" },
  });

  revalidatePath(`/admin/assessments/${assessmentId}/educators`);
  const result = await inviteEducatorsToAssessment(assessmentId, [email]);
  return inviteActionState(result);
}

export async function removeEducatorAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  await prisma.assessmentEducator.update({ where: { id }, data: { status: "REMOVED", removedAt: new Date() } });
  revalidatePath(`/admin/assessments/${assessmentId}/educators`);
}

export async function resendEducatorInviteAction(_previousState: EducatorInviteActionState, formData: FormData): Promise<EducatorInviteActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const educator = await prisma.assessmentEducator.findUnique({ where: { id }, select: { email: true } });
  if (!educator) return { error: "TA invite not found.", previews: [] };

  const result = await inviteEducatorsToAssessment(assessmentId, [educator.email]);
  revalidatePath(`/admin/assessments/${assessmentId}/educators`);
  return inviteActionState(result);
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  const colours = {
    primaryColour: String(formData.get("primaryColour") ?? "#31536a"),
    secondaryColour: String(formData.get("secondaryColour") ?? "#59798e"),
    accentColour: String(formData.get("accentColour") ?? "#0f766e"),
    nightPrimaryColour: String(formData.get("nightPrimaryColour") ?? "#7dd3fc"),
    nightSecondaryColour: String(formData.get("nightSecondaryColour") ?? "#94a3b8"),
    nightAccentColour: String(formData.get("nightAccentColour") ?? "#2dd4bf"),
  };
  await prisma.universitySettings.upsert({
    where: { id: "default" },
    update: {
      name: String(formData.get("name") ?? "").trim() || null,
      logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
      ...colours,
    } as never,
    create: {
      id: "default",
      name: String(formData.get("name") ?? "").trim() || null,
      logoUrl: String(formData.get("logoUrl") ?? "").trim() || null,
      ...colours,
    } as never,
  });
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
}
