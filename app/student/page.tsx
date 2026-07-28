import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";

export default async function StudentPage() {
  const student = await requireStudent();
  if (student.mustChangePassword) redirect("/change-password");

  redirect("/student/dashboard");
}
