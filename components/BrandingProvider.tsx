"use client";

import { createContext, useContext } from "react";
import type { UniversityBranding } from "@/lib/university-settings";

const BrandingContext = createContext<UniversityBranding | null>(null);

export function BrandingProvider({
  branding,
  children,
}: Readonly<{ branding: UniversityBranding; children: React.ReactNode }>) {
  return <BrandingContext.Provider value={branding}>{children}</BrandingContext.Provider>;
}

export function useUniversityBranding() {
  const branding = useContext(BrandingContext);
  if (!branding) throw new Error("useUniversityBranding must be used within BrandingProvider");
  return branding;
}

export function BrandIdentity({ subtitle }: Readonly<{ subtitle?: string }>) {
  const branding = useUniversityBranding();

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className={`${branding.logoUrl ? "w-24" : "w-11"} flex h-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-primary font-bold text-white`}>
        {branding.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={branding.logoUrl} alt={`${branding.name} logo`} className="h-full w-full bg-white object-contain" />
        ) : (
          branding.name.charAt(0).toUpperCase()
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold">{branding.name}</p>
        {subtitle && <p className="truncate text-xs text-brand-muted">{subtitle}</p>}
      </div>
    </div>
  );
}
