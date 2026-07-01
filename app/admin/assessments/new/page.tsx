import Link from "next/link";
import NewAssessmentForm from "@/components/admin/NewAssessmentForm";

export default function NewAssessmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="focus-ring text-sm font-semibold text-brand-primary">
          Back to dashboard
        </Link>
        <h1 className="mt-3 text-3xl font-bold">Create assessment</h1>
        <p className="mt-2 max-w-3xl text-sm text-brand-muted">
          Set up the assessment, repeating deadlines, group sizing, educator count, and feedback visibility.
        </p>
      </div>
      <NewAssessmentForm />
    </div>
  );
}
