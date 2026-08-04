"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, requireEducator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { generateTemporaryPassword } from "@/lib/invites";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AddStudentActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  name?: string;
  username?: string;
  temporaryPassword?: string;
  accountCreated?: boolean;
};

export type OverrideScoresActionState = {
  status: "idle" | "error" | "success";
  message?: string;
};

export async function educatorLogoutAction() {
  await clearSession();
  redirect("/login");
}

export async function joinAssessmentAction(formData: FormData) {
  const user = await requireEducator();
  const inviteId = String(formData.get("inviteId") ?? "");

  await prisma.assessmentEducator.updateMany({
    where: {
      id: inviteId,
      userId: user.id,
      removedAt: null,
    },
    data: {
      status: "JOINED",
      joinedAt: new Date(),
    },
  });

  revalidatePath("/educator");
}

export async function createGroupAction(formData: FormData) {
  const educator = await requireEducator();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const groupName = String(formData.get("groupName") ?? "").trim();

  const invite = await prisma.assessmentEducator.findFirst({
    where: {
      assessmentId,
      userId: educator.id,
      status: "JOINED",
      removedAt: null,
    },
    include: { assessment: true },
  });

  if (!invite || !groupName) {
    redirect("/educator");
  }

  const assessmentClass =
    (await prisma.class.findFirst({ where: { assessmentId } })) ??
    (await prisma.class.create({
      data: {
        assessmentId,
        name: "Default class",
      },
    }));

  await prisma.group.create({
    data: {
      classId: assessmentClass.id,
      educatorId: educator.id,
      name: groupName,
    },
  });

  revalidatePath(`/educator/assessments/${assessmentId}`);
}

export async function updateGroupCapacityAction(formData: FormData) {
  const educator = await requireEducator();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const capacityValue = formData.get("resetCapacity") === "true"
    ? ""
    : String(formData.get("capacity") ?? "").trim();

  const [invite, group] = await Promise.all([
    prisma.assessmentEducator.findFirst({
      where: { assessmentId, userId: educator.id, status: "JOINED", removedAt: null },
      select: { id: true, assessment: { select: { studentsPerGroup: true } } },
    }),
    prisma.group.findFirst({
      where: { id: groupId, class: { assessmentId } },
      select: { id: true, _count: { select: { members: true } } },
    }),
  ]);

  if (!invite || !group) return;

  const capacity = capacityValue === "" ? null : Number(capacityValue);
  if (capacity !== null && (!Number.isInteger(capacity) || capacity < group._count.members || capacity > 100)) return;
  if (capacity === null && group._count.members > invite.assessment.studentsPerGroup) return;

  await prisma.group.update({
    where: { id: group.id },
    data: { capacityOverride: capacity },
  });

  revalidatePath(`/educator/assessments/${assessmentId}`);
}

export async function overrideContributionScoresAction(
  _previousState: OverrideScoresActionState,
  formData: FormData
): Promise<OverrideScoresActionState> {
  const educator = await requireEducator();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const submissionId = String(formData.get("submissionId") ?? "");
  const reset = formData.get("reset") === "true";

  const submission = await prisma.submission.findFirst({
    where: {
      id: submissionId,
      group: { class: { assessmentId } },
      assessmentWeek: { assessmentId, assessment: { educators: { some: { userId: educator.id, status: "JOINED", removedAt: null } } } },
    },
    include: { scores: true, group: { include: { members: { select: { studentId: true } } } } },
  });

  if (!submission) return { status: "error", message: "Submission not found or access was denied." };

  if (reset) {
    await prisma.contributionScore.updateMany({
      where: { submissionId },
      data: { educatorOverridePoints: null, educatorOverriddenAt: null },
    });
    revalidatePath(`/educator/assessments/${assessmentId}`);
    revalidatePath(`/student/assessments/${assessmentId}`);
    return { status: "success", message: "The student's original allocation has been restored." };
  }

  const memberIds = submission.group.members.map((member) => member.studentId).sort();
  const scoreIds = submission.scores.map((score) => score.targetStudentId).sort();
  if (memberIds.join("|") !== scoreIds.join("|")) return { status: "error", message: "The submission scores do not match the current group members." };

  const overrides = submission.scores.map((score) => ({
    id: score.id,
    originalPoints: score.points,
    points: Number(formData.get(`score:${score.targetStudentId}`)),
  }));
  if (overrides.some((score) => !Number.isInteger(score.points) || score.points < 0 || score.points > 100) || overrides.reduce((sum, score) => sum + score.points, 0) !== 100) {
    return { status: "error", message: "Adjusted scores must be whole numbers totalling exactly 100." };
  }

  const overriddenAt = new Date();
  await prisma.$transaction(overrides.map((score) => prisma.contributionScore.update({
    where: { id: score.id },
    data: score.points === score.originalPoints
      ? { educatorOverridePoints: null, educatorOverriddenAt: null }
      : { educatorOverridePoints: score.points, educatorOverriddenAt: overriddenAt },
  })));

  revalidatePath(`/educator/assessments/${assessmentId}`);
  revalidatePath(`/student/assessments/${assessmentId}`);
  return { status: "success", message: "Adjusted scores saved. Students will see them marked as educator overrides." };
}

export async function addStudentAction(
  _previousState: AddStudentActionState,
  formData: FormData
): Promise<AddStudentActionState> {
  const educator = await requireEducator();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("studentName") ?? "").trim();
  const studentId = String(formData.get("studentId") ?? "").trim();
  const email = String(formData.get("studentEmail") ?? "").trim().toLowerCase();

  const invite = await prisma.assessmentEducator.findFirst({
    where: { assessmentId, userId: educator.id, status: "JOINED", removedAt: null },
    include: { assessment: true },
  });
  const group = await prisma.group.findFirst({
    where: { id: groupId, class: { assessmentId } },
    include: { _count: { select: { members: true } } },
  });

  if (!invite || !group) return { status: "error", message: "This group could not be found." };
  if (!name || !studentId || !emailPattern.test(email)) {
    return { status: "error", message: "Enter a name, student ID, and valid email address." };
  }
  const groupCapacity = group.capacityOverride ?? invite.assessment.studentsPerGroup;
  if (group._count.members >= groupCapacity) {
    return { status: "error", message: "This group is already full." };
  }

  const [existingUser, studentIdOwner] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { studentId } }),
  ]);
  if (existingUser && existingUser.role !== "STUDENT") {
    return { status: "error", message: "That email belongs to a non-student account." };
  }
  if (studentIdOwner && studentIdOwner.id !== existingUser?.id) {
    return { status: "error", message: "That student ID is already used by another account." };
  }

  const needsCredentials = !existingUser?.passwordHash;
  const temporaryPassword = needsCredentials ? generateTemporaryPassword() : undefined;
  const username = existingUser?.username ?? email;
  const student = existingUser
    ? await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          studentId,
          username,
          ...(temporaryPassword
            ? { passwordHash: await hashPassword(temporaryPassword), mustChangePassword: true }
            : {}),
        },
      })
    : await prisma.user.create({
        data: {
          name,
          studentId,
          email,
          username,
          role: "STUDENT",
          passwordHash: await hashPassword(temporaryPassword!),
          mustChangePassword: true,
        },
      });

  await prisma.groupMember.upsert({
    where: { groupId_studentId: { groupId, studentId: student.id } },
    update: {},
    create: { groupId, studentId: student.id },
  });

  revalidatePath(`/educator/assessments/${assessmentId}`);
  return {
    status: "success",
    name: student.name,
    username: student.username ?? student.email,
    temporaryPassword,
    accountCreated: needsCredentials,
  };
}

export async function deleteGroupAction(formData: FormData) {
  const educator = await requireEducator();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");

  const invite = await prisma.assessmentEducator.findFirst({
    where: { assessmentId, userId: educator.id, status: "JOINED", removedAt: null },
    select: { id: true },
  });
  const group = await prisma.group.findFirst({
    where: { id: groupId, class: { assessmentId } },
    select: { id: true, _count: { select: { submissions: true } } },
  });

  if (!invite || !group || group._count.submissions > 0) return;

  await prisma.$transaction([
    prisma.groupMember.deleteMany({ where: { groupId } }),
    prisma.group.delete({ where: { id: groupId } }),
  ]);

  revalidatePath(`/educator/assessments/${assessmentId}`);
}

export async function removeStudentFromGroupAction(formData: FormData) {
  const educator = await requireEducator();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  const membershipId = String(formData.get("membershipId") ?? "");

  const [invite, membership] = await Promise.all([
    prisma.assessmentEducator.findFirst({
      where: { assessmentId, userId: educator.id, status: "JOINED", removedAt: null },
      select: { id: true },
    }),
    prisma.groupMember.findFirst({
      where: { id: membershipId, groupId, group: { class: { assessmentId } } },
      select: { id: true, studentId: true },
    }),
  ]);

  if (!invite || !membership) return;

  const removedSubmissions = await prisma.submission.findMany({
    where: { groupId, submittedByStudentId: membership.studentId },
    select: { id: true },
  });
  const removedSubmissionIds = removedSubmissions.map((submission) => submission.id);

  await prisma.$transaction([
    prisma.feedback.deleteMany({
      where: {
        submission: { groupId },
        OR: [
          { fromStudentId: membership.studentId },
          { toStudentId: membership.studentId },
          { submissionId: { in: removedSubmissionIds } },
        ],
      },
    }),
    prisma.contributionScore.deleteMany({
      where: {
        OR: [
          { targetStudentId: membership.studentId, submission: { groupId } },
          { submissionId: { in: removedSubmissionIds } },
        ],
      },
    }),
    prisma.submission.deleteMany({ where: { id: { in: removedSubmissionIds } } }),
    prisma.groupMember.delete({ where: { id: membership.id } }),
  ]);

  revalidatePath(`/educator/assessments/${assessmentId}`);
  revalidatePath(`/student/assessments/${assessmentId}`);
  revalidatePath("/student/dashboard");
}
