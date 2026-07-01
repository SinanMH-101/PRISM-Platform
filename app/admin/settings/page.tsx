import SettingsForm from "@/components/admin/SettingsForm";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-primary">Admin</p>
        <h1 className="mt-1 text-3xl font-bold">Settings</h1>
        <p className="mt-2 max-w-3xl text-sm text-brand-muted">Manage university branding and theme colours for the assessment platform.</p>
      </div>
      <SettingsForm />
    </div>
  );
}
