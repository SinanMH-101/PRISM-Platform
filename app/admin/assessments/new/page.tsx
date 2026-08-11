import Link from "next/link";
import NewAssessmentForm from "@/components/admin/NewAssessmentForm";

export default function NewAssessmentPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin" className="focus-ring inline-flex rounded-lg border border-brand-border bg-brand-surface px-4 py-2 text-sm font-semibold hover:border-brand-primary hover:bg-brand-primary hover:text-white">
          Back to home
        </Link>
  
        <p className="mt-2 max-w-3xl text-sm text-brand-muted">
          
        </p>
      </div>
      <NewAssessmentForm />
    </div>
  );
}
