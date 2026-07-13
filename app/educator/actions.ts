"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireEducator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  const names = formData.getAll("studentName").map((value) => String(value).trim());
  const emails = formData.getAll("studentEmail").map((value) => String(value).trim().toLowerCase());
  const students = emails
    .map((email, index) => ({ email, name: names[index] || email }))
    .filter((student) => emailPattern.test(student.email))
    .slice(0, invite.assessment.studentsPerGroup);

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
      name: groupName,
      members: {
        create: await Promise.all(
          students.map(async (student) => {
            const user = await prisma.user.upsert({
              where: { email: student.email },
              update: {
                name: student.name,
              },
              create: {
                name: student.name,
                email: student.email,
                username: student.email,
                role: "STUDENT",
              },
            });

            return { studentId: user.id };
          })
        ),
      },
    },
  });

  revalidatePath(`/educator/assessments/${assessmentId}`);
}
