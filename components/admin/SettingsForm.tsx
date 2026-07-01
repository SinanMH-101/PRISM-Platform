"use client";

import { ChangeEvent, useState } from "react";

export default function SettingsForm() {
  const [logoName, setLogoName] = useState("No logo selected");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [theme, setTheme] = useState({ primary: "#31536a", secondary: "#59798e", accent: "#0f766e" });

  function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogoName(file.name);
    setLogoPreview(URL.createObjectURL(file));
  }

  return (
    <section className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <h2 className="text-xl font-bold">University logo</h2>
          <div className="mt-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-white">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-2xl font-bold text-brand-primary">U</span>
            )}
          </div>
          <label className="mt-4 block cursor-pointer rounded-lg border border-brand-border px-4 py-2 text-center text-sm font-semibold hover:bg-brand-background">
            Upload/change university logo
            <input type="file" accept="image/*" onChange={uploadLogo} className="sr-only" />
          </label>
          <p className="mt-2 truncate text-xs text-brand-muted">{logoName}</p>
        </div>

        <div>
          <h2 className="text-xl font-bold">Theme colours</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {(["primary", "secondary", "accent"] as const).map((key) => (
              <label key={key} className="text-sm font-semibold capitalize">
                {key}
                <input
                  type="color"
                  value={theme[key]}
                  onChange={(event) => setTheme((current) => ({ ...current, [key]: event.target.value }))}
                  className="mt-2 h-12 w-full cursor-pointer rounded border border-brand-border bg-white"
                />
              </label>
            ))}
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <Swatch label="Primary" color={theme.primary} />
            <Swatch label="Secondary" color={theme.secondary} />
            <Swatch label="Accent" color={theme.accent} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Swatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="rounded-lg border border-brand-border p-3">
      <div className="h-12 rounded" style={{ backgroundColor: color }} />
      <p className="mt-2 text-sm font-semibold">{label}</p>
      <p className="text-xs text-brand-muted">{color}</p>
    </div>
  );
}
