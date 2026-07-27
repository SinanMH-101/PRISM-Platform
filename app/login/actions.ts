"use server";

import { redirect } from "next/navigation";
import { authenticate, createSession, getRoleHomePath } from "@/lib/auth";

export async function loginAction(_previousState: string | null, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return "Enter your username and password.";
  }

  const user = await authenticate(username, password);

  if (!user) {
    return "Invalid credentials.";
  }

  await createSession(user.id);

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  redirect(getRoleHomePath(user.role));
}
