import { cache } from "react";
import { prisma } from "./prisma";

export type UniversityBranding = {
  name: string;
  logoUrl: string | null;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
  nightPrimaryColour: string;
  nightSecondaryColour: string;
  nightAccentColour: string;
};

export const defaultUniversityBranding: UniversityBranding = {
  name: "University Team Assessment",
  logoUrl: null,
  primaryColour: "#31536a",
  secondaryColour: "#59798e",
  accentColour: "#0f766e",
  nightPrimaryColour: "#7dd3fc",
  nightSecondaryColour: "#94a3b8",
  nightAccentColour: "#2dd4bf",
};

export const getUniversityBranding = cache(async (): Promise<UniversityBranding> => {
  const settings = await prisma.universitySettings.findUnique({ where: { id: "default" } });
  const nightSettings = settings as (typeof settings & {
    nightPrimaryColour?: string;
    nightSecondaryColour?: string;
    nightAccentColour?: string;
  });

  return {
    name: settings?.name?.trim() || defaultUniversityBranding.name,
    logoUrl: settings?.logoUrl?.trim() || null,
    primaryColour: settings?.primaryColour || defaultUniversityBranding.primaryColour,
    secondaryColour: settings?.secondaryColour || defaultUniversityBranding.secondaryColour,
    accentColour: settings?.accentColour || defaultUniversityBranding.accentColour,
    nightPrimaryColour: nightSettings?.nightPrimaryColour || defaultUniversityBranding.nightPrimaryColour,
    nightSecondaryColour: nightSettings?.nightSecondaryColour || defaultUniversityBranding.nightSecondaryColour,
    nightAccentColour: nightSettings?.nightAccentColour || defaultUniversityBranding.nightAccentColour,
  };
});
