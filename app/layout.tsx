import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { BrandingProvider } from "@/components/BrandingProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
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
    "--color-night-primary": branding.nightPrimaryColour,
    "--color-night-secondary": branding.nightSecondaryColour,
    "--color-night-accent": branding.nightAccentColour,
  } as CSSProperties;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})()`,
          }}
        />
      </head>
      <body style={themeStyle}>
        <BrandingProvider branding={branding}>{children}</BrandingProvider>
        <ThemeToggle />
      </body>
    </html>
  );
}
