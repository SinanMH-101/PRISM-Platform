"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireEducator } from "@/lib/auth";
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
  if (group._count.members >= invite.assessment.studentsPerGroup) {
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
