import { createAssessmentAction } from "@/app/admin/actions";
import { deadlineDays } from "./data";

export default function NewAssessmentForm() {
  return (
    <form action={createAssessmentAction} className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-brand-border bg-brand-surface shadow-soft">
      <FormSection title="Assessment details">
        <TextField label="Assessment name" name="name" placeholder="Assessment 1 Peer Review" />
        <TextField label="Unit code" name="unitCode" placeholder="COMP3000" />
      </FormSection>

      <FormSection title="Weighting">
        <NumberField
          label="Assessment weighting within the unit"
          help="Example: Assessment 1 is worth 40% of the final grade."
          name="assessmentWeighting"
          defaultValue={40}
          suffix="%"
        />
        <NumberField
          label="Process/team assessment weighting within this assessment"
          help="Example: 50% of a 40% assessment means the process component is worth 20% overall."
          name="processWeighting"
          defaultValue={50}
          suffix="%"
        />
      </FormSection>

      <FormSection title="Cohort and staffing">
        <NumberField label="Cohort size" name="cohortSize" defaultValue={120} />
        <NumberField label="Students per group" name="studentsPerGroup" defaultValue={5} />
        <NumberField label="Number of educators" name="educatorCount" defaultValue={4} />
      </FormSection>

      <FormSection title="Deadline schedule">
        <SelectField label="Repeat type" name="repeatType" defaultValue="WEEKLY">
          <option value="WEEKLY">Weekly</option>
          <option value="FORTNIGHTLY">Fortnightly</option>
        </SelectField>
        <SelectField label="Deadline day" name="deadlineDay" defaultValue="SUNDAY">
          {deadlineDays.map((day) => (
            <option key={day} value={day.toUpperCase()}>
              {day}
            </option>
          ))}
        </SelectField>
        <TextField label="Deadline time" name="deadlineTime" type="time" defaultValue="23:55" />
        <TextField label="Number of weeks" name="weeks" type="number" defaultValue="13" />
        <TextField label="Start date" name="startDate" type="date" defaultValue="2026-07-27" />
      </FormSection>

      <fieldset className="border-t border-brand-border px-5 py-6">
        <legend className="text-base font-bold">Feedback visibility</legend>
        <div className="mt-4 space-y-3">
          <RadioOption
            name="feedbackVisibility"
            value="IMMEDIATE_AFTER_SUBMISSION"
            label="Students can see peer feedback immediately after submitting"
          />
          <RadioOption
            name="feedbackVisibility"
            value="AFTER_DEADLINE"
            label="Students can see peer feedback only after the weekly deadline"
            defaultChecked
          />
        </div>
      </fieldset>

      <div className="flex justify-end border-t border-brand-border bg-brand-background px-5 py-4">
        <button className="focus-ring w-full rounded-lg bg-brand-primary px-5 py-3 font-semibold text-white hover:opacity-90 sm:w-auto">
          Continue to educator allocation
        </button>
      </div>
    </form>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-brand-border px-5 py-6 first:border-t-0">
      <h2 className="text-base font-bold">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function TextField({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal"
      />
    </label>
  );
}

function NumberField({
  label,
  name,
  defaultValue,
  suffix,
  help,
}: {
  label: string;
  name: string;
  defaultValue: number;
  suffix?: string;
  help?: string;
}) {
  return (
    <label className="block text-sm font-semibold">
      <span>{label}</span>
      {help && <span className="mt-1 block text-xs font-normal leading-5 text-brand-muted">{help}</span>}
      <div className="mt-2 flex h-11 overflow-hidden rounded-lg border border-brand-border bg-white">
        <input name={name} type="number" min={0} defaultValue={defaultValue} className="focus-ring w-full border-0 px-3 font-normal outline-none" />
        {suffix && <span className="flex items-center border-l border-brand-border bg-brand-background px-3 text-brand-muted">{suffix}</span>}
      </div>
    </label>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  children,
}: {
  label: string;
  name: string;
  defaultValue: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-semibold">
      <span>{label}</span>
      <select name={name} defaultValue={defaultValue} className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal">
        {children}
      </select>
    </label>
  );
}

function RadioOption({
  name,
  value,
  label,
  defaultChecked,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-lg border border-brand-border bg-white px-3 py-3 text-sm font-semibold">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{label}</span>
    </label>
  );
}
