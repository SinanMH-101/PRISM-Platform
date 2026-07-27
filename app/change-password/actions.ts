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

  if (password.length < 8) return "Password must be at least 8 characters.";
  if (password !== confirmPassword) return "Passwords do not match.";

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      mustChangePassword: false,
    },
  });

  redirect(getRoleHomePath(user.role));
}
