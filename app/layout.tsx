import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { BrandingProvider } from "@/components/BrandingProvider";
import { getUniversityBranding } from "@/lib/university-settings";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getUniversityBranding();
  return {
    title: branding.name,
    description: `${branding.name} team assessment platform`,
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const branding = await getUniversityBranding();
  const themeStyle = {
    "--color-primary": branding.primaryColour,
    "--color-secondary": branding.secondaryColour,
    "--color-muted": branding.secondaryColour,
    "--color-accent": branding.accentColour,
  } as CSSProperties;

  return (
    <html lang="en">
      <body style={themeStyle}>
        <BrandingProvider branding={branding}>{children}</BrandingProvider>
      </body>
    </html>
  );
}
