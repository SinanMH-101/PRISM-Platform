import { cache } from "react";
import { prisma } from "./prisma";

export type UniversityBranding = {
  name: string;
  logoUrl: string | null;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
};

export const defaultUniversityBranding: UniversityBranding = {
  name: "University Team Assessment",
  logoUrl: null,
  primaryColour: "#31536a",
  secondaryColour: "#59798e",
  accentColour: "#0f766e",
};

export const getUniversityBranding = cache(async (): Promise<UniversityBranding> => {
  const settings = await prisma.universitySettings.findUnique({ where: { id: "default" } });

  return {
    name: settings?.name?.trim() || defaultUniversityBranding.name,
    logoUrl: settings?.logoUrl?.trim() || null,
    primaryColour: settings?.primaryColour || defaultUniversityBranding.primaryColour,
    secondaryColour: settings?.secondaryColour || defaultUniversityBranding.secondaryColour,
    accentColour: settings?.accentColour || defaultUniversityBranding.accentColour,
  };
});
