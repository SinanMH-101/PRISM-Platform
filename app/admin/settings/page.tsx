import SettingsForm from "@/components/admin/SettingsForm";
import { getUniversitySettings } from "@/components/admin/data";

export default async function AdminSettingsPage() {
  const settings = await getUniversitySettings();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-primary">Admin</p>
        <h1 className="mt-1 text-3xl font-bold">Settings</h1>
        <p className="mt-2 max-w-3xl text-sm text-brand-muted">Manage university branding and theme colours for the assessment platform.</p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  );
}
