"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { CSSProperties } from "react";
import { logoutAction } from "@/app/admin/actions";

type AdminShellSettings = {
  name?: string | null;
  logoUrl?: string | null;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
  nightPrimaryColour: string;
  nightSecondaryColour: string;
  nightAccentColour: string;
};

export default function AdminShell({
  children,
  userName,
  settings,
}: Readonly<{ children: React.ReactNode; userName: string; settings: AdminShellSettings }>) {
  const appName = settings.name?.trim() || "University Team Assessment";
  const pathname = usePathname();
  const themeStyle = {
    "--color-primary": settings.primaryColour,
    "--color-secondary": settings.secondaryColour,
    "--color-muted": settings.secondaryColour,
    "--color-accent": settings.accentColour,
    "--color-night-primary": settings.nightPrimaryColour,
    "--color-night-secondary": settings.nightSecondaryColour,
    "--color-night-accent": settings.nightAccentColour,
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
              <p className="text-xs text-brand-muted">Convenor workspace</p>
            </div>
          </Link>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="rounded-lg border border-brand-border px-3 py-2 text-brand-muted">Signed in as {userName}</span>
            <Link href="/admin" className={navLinkClass(pathname === "/admin" || pathname.startsWith("/admin/assessments"))}>
              Home
            </Link>
            <Link href="/admin/settings" className={navLinkClass(pathname.startsWith("/admin/settings"))}>
              Settings
            </Link>
            <Link href="/admin/accounts" className={navLinkClass(pathname.startsWith("/admin/accounts"))}>
              Accounts
            </Link>
            <form action={logoutAction}>
              <button className={navLinkClass(false)}>Log out</button>
            </form>
          </div>
        </div>
      </nav>
      <div className="mx-auto max-w-7xl px-5 py-7">{children}</div>
    </main>
  );
}

function navLinkClass(active: boolean) {
  return `focus-ring rounded-lg border px-3 py-2 font-semibold transition-colors ${
    active
      ? "border-brand-primary bg-brand-primary text-white"
      : "border-brand-border bg-brand-surface text-brand-text hover:border-brand-primary hover:bg-brand-primary hover:text-white"
  }`;
}
