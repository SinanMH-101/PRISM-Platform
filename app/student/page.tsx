import { redirect } from "next/navigation";
import StudentAssessmentPage from "@/components/StudentAssessmentPage";
import { requireStudent } from "@/lib/auth";

export default async function StudentPage() {
  const student = await requireStudent();
  if (student.mustChangePassword) redirect("/change-password");

  return <StudentAssessmentPage currentStudentName={student.name} />;
}
