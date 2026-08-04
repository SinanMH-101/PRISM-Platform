import AdminShell from "@/components/admin/AdminShell";
import { getUniversitySettings } from "@/components/admin/data";
import { requireAdmin } from "@/lib/auth";

const defaultSettings = {
  name: "University Team Assessment",
  logoUrl: null,
  primaryColour: "#31536a",
  secondaryColour: "#59798e",
  accentColour: "#0f766e",
  nightPrimaryColour: "#7dd3fc",
  nightSecondaryColour: "#94a3b8",
  nightAccentColour: "#2dd4bf",
};

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin();
  const settings = (await getUniversitySettings()) ?? defaultSettings;

  return (
    <AdminShell userName={user.username ?? user.name} settings={settings}>
      {children}
    </AdminShell>
  );
}
