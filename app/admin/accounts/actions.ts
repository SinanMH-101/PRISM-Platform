"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export type AccountActionState = {
  error?: string;
  message?: string;
};

export async function resetAccountPasswordAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const password = String(formData.get("password") ?? "");

  if (password.length < 8) return { error: "Temporary passwords must be at least 8 characters." };

  const account = await prisma.user.findFirst({
    where: { id: userId, role: { in: ["EDUCATOR", "STUDENT"] }, deletedAt: null },
    select: { id: true, name: true },
  });
  if (!account) return { error: "Account not found." };

  await prisma.$transaction([
    prisma.user.update({
      where: { id: account.id },
      data: { passwordHash: await hashPassword(password), mustChangePassword: true },
    }),
    prisma.session.deleteMany({ where: { userId: account.id } }),
  ]);

  revalidatePath("/admin/accounts");
  return { message: `Password reset for ${account.name}. They must change it after signing in.` };
}

export async function deleteAccountAction(
  _previousState: AccountActionState,
  formData: FormData
): Promise<AccountActionState> {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");

  const account = await prisma.user.findFirst({
    where: { id: userId, role: { in: ["EDUCATOR", "STUDENT"] }, deletedAt: null },
    select: { id: true, name: true, assessmentEducators: { select: { id: true } } },
  });
  if (!account) return { error: "Account not found." };

  const deletedAt = new Date();
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: account.id } }),
    prisma.assessmentEducator.updateMany({
      where: { userId: account.id },
      data: { status: "REMOVED", removedAt: deletedAt },
    }),
    prisma.user.update({
      where: { id: account.id },
      data: {
        name: "Deleted user",
        email: `deleted-${account.id}@invalid.local`,
        username: null,
        studentId: null,
        passwordHash: null,
        mustChangePassword: false,
        deletedAt,
      },
    }),
  ]);

  revalidatePath("/admin/accounts");
  revalidatePath("/admin");
  return { message: `${account.name}'s account was deleted. Historical assessment records were retained.` };
}
