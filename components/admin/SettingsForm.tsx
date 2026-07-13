import { saveSettingsAction } from "@/app/admin/actions";

type SettingsValues = {
  name?: string | null;
  logoUrl?: string | null;
  primaryColour: string;
  secondaryColour: string;
  accentColour: string;
};

const defaultSettings: SettingsValues = {
  name: "",
  logoUrl: "",
  primaryColour: "#31536a",
  secondaryColour: "#59798e",
  accentColour: "#0f766e",
};

export default function SettingsForm({ settings }: { settings?: SettingsValues | null }) {
  const values = settings ?? defaultSettings;

  return (
    <form action={saveSettingsAction} className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div>
          <h2 className="text-xl font-bold">University details</h2>
          <div className="mt-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-lg border border-brand-border bg-white">
            {values.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={values.logoUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <span className="text-2xl font-bold text-brand-primary">U</span>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <TextInput label="University name" name="name" defaultValue={values.name ?? ""} />
          <TextInput label="Logo URL" name="logoUrl" defaultValue={values.logoUrl ?? ""} />

          <div className="grid gap-4 md:grid-cols-3">
            <ColourInput label="Primary colour" name="primaryColour" defaultValue={values.primaryColour} />
            <ColourInput label="Secondary colour" name="secondaryColour" defaultValue={values.secondaryColour} />
            <ColourInput label="Accent colour" name="accentColour" defaultValue={values.accentColour} />
          </div>

          <div className="flex justify-end">
            <button className="focus-ring rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Save settings
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function TextInput({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input name={name} defaultValue={defaultValue} className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal" />
    </label>
  );
}

function ColourInput({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input name={name} type="color" defaultValue={defaultValue} className="mt-2 h-11 w-full cursor-pointer rounded border border-brand-border bg-white" />
    </label>
  );
}
