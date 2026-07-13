import Link from "next/link";
import type { CSSProperties } from "react";
import { logoutAction } from "@/app/admin/actions";

type AdminShellSettings = {
  name?: string | null;
  logoUrl?: string | null;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
};

export default function AdminShell({
  children,
  userName,
  settings,
}: Readonly<{ children: React.ReactNode; userName: string; settings: AdminShellSettings }>) {
  const appName = settings.name?.trim() || "University Team Assessment";
  const themeStyle = {
    "--color-primary": settings.primaryColour,
    "--color-secondary": settings.secondaryColour,
    "--color-muted": settings.secondaryColour,
    "--color-accent": settings.accentColour,
  } as CSSProperties;

  return (
    <main className="min-h-screen bg-brand-background text-brand-text" style={themeStyle}>
      <nav className="border-b border-brand-border bg-brand-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/admin" className="focus-ring flex items-center gap-3 rounded-lg">
            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-brand-primary text-sm font-bold text-white">
              {settings.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.logoUrl} alt="" className="h-full w-full object-contain bg-white" />
              ) : (
                "U"
              )}
            </div>
            <div>
              <p className="text-sm font-semibold">{appName}</p>
              <p className="text-xs text-brand-muted">Admin workspace</p>
            </div>
          </Link>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-lg border border-brand-border px-3 py-2 text-brand-muted">Signed in as {userName}</span>
            <Link href="/admin" className="focus-ring rounded-lg border border-brand-border px-3 py-2 font-semibold hover:bg-brand-background">
              Dashboard
            </Link>
            <Link href="/admin/assessments/new" className="focus-ring rounded-lg bg-brand-primary px-3 py-2 font-semibold text-white hover:opacity-90">
              New Assessment
            </Link>
            <Link href="/admin/settings" className="focus-ring rounded-lg border border-brand-border px-3 py-2 font-semibold hover:bg-brand-background">
              Settings
            </Link>
            <form action={logoutAction}>
              <button className="focus-ring rounded-lg border border-brand-border px-3 py-2 font-semibold hover:bg-brand-background">Log out</button>
            </form>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl px-5 py-7">{children}</div>
    </main>
  );
}
