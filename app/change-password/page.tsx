import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BrandIdentity } from "@/components/BrandingProvider";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-background px-5 py-10 text-brand-text">
      <section className="w-full max-w-md rounded-lg border border-brand-border bg-brand-surface p-6 shadow-soft">
        <div className="mb-5"><BrandIdentity subtitle="Team assessment platform" /></div>
        <p className="text-sm font-semibold text-brand-primary">Account setup</p>
        <h1 className="mt-1 text-3xl font-bold">Complete your account</h1>
        <p className="mt-2 text-sm text-brand-muted">Confirm your name and set your own password before continuing.</p>
        <ChangePasswordForm defaultName={user.name} />
      </section>
    </main>
  );
}
