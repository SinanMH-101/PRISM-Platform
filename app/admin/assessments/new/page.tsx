import Link from "next/link";
import NewAssessmentForm from "@/components/admin/NewAssessmentForm";

export default function NewAssessmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="focus-ring text-sm font-semibold text-brand-primary">
          Back to dashboard
        </Link>
  
        <p className="mt-2 max-w-3xl text-sm text-brand-muted">
          
        </p>
      </div>
      <NewAssessmentForm />
    </div>
  );
}
