import AdminShell from "@/components/admin/AdminShell";
import { getUniversitySettings } from "@/components/admin/data";
import { requireAdmin } from "@/lib/auth";

const defaultSettings = {
  name: "University Team Assessment",
  logoUrl: null,
  primaryColour: "#31536a",
  secondaryColour: "#59798e",
  accentColour: "#0f766e",
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
