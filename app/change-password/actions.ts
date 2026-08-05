"use server";

import { redirect } from "next/navigation";
import { getCurrentUser, getRoleHomePath } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function changePasswordAction(_previousState: string | null, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const name = String(formData.get("name") ?? "").trim().replace(/\s+/g, " ");

  if (name.length < 2) return "Enter your full name.";
  if (name.length > 100) return "Name must be 100 characters or fewer.";
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password !== confirmPassword) return "Passwords do not match.";

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        passwordHash: await hashPassword(password),
        mustChangePassword: false,
      },
    }),
    prisma.assessmentEducator.updateMany({ where: { userId: user.id }, data: { name } }),
  ]);

  redirect(getRoleHomePath(user.role));
}
