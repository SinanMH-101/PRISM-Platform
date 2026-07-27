import { redirect } from "next/navigation";
import { getCurrentUser, getRoleHomePath } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.mustChangePassword) redirect("/change-password");
    redirect(getRoleHomePath(user.role));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-background px-5 py-10 text-brand-text">
      <section className="w-full max-w-md rounded-lg border border-brand-border bg-brand-surface p-6 shadow-soft">
        <div className="mb-6">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-primary text-sm font-bold text-white">U</div>
          <p className="text-sm font-semibold text-brand-primary">Admin access</p>
          <h1 className="mt-1 text-3xl font-bold">Sign in</h1>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
