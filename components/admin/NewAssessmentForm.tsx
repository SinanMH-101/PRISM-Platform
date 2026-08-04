import { createAssessmentAction, updateAssessmentAction } from "@/app/admin/actions";
import { deadlineDays } from "./data";

type AssessmentDefaults = {
  id: string;
  name: string;
  unitCode: string;
  semester: string;
  assessmentWeighting: number;
  processWeighting: number;
  cohortSize: number;
  studentsPerGroup: number;
  educatorCount: number;
  repeatType: string;
  deadlineDay: string;
  deadlineTime: string;
  numberOfWeeks: number;
  startDate: Date;
  feedbackVisibility: string;
};

export default function NewAssessmentForm({ assessment, minimumWeeks = 1 }: { assessment?: AssessmentDefaults; minimumWeeks?: number }) {
  const currentYear = new Date().getFullYear();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Australia/Sydney", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [storedYear, storedPeriod] = assessment?.semester.split(" ") ?? [String(currentYear), "S2"];
  const firstYear = Math.min(currentYear - 1, Number(storedYear));
  const semesterYears = Array.from({ length: Math.max(7, currentYear + 5 - firstYear) }, (_, index) => firstYear + index);

  return (
    <form action={assessment ? updateAssessmentAction : createAssessmentAction} className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-brand-border bg-brand-surface shadow-soft">
      {assessment && <input type="hidden" name="assessmentId" value={assessment.id} />}
      <div className="border-b border-brand-border bg-gradient-to-r from-brand-primary to-brand-secondary px-6 py-6 text-white sm:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/70">Assessment setup</p>
        <h2 className="mt-2 text-2xl font-bold">{assessment ? "Update assessment settings" : "Create a new assessment"}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">Configure the assessment structure, teaching team, submission schedule, and student feedback experience.</p>
      </div>
      <FormSection number="1" title="Assessment details" description="Give educators and students a clear way to identify this assessment.">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1.5fr)_minmax(180px,0.7fr)]">
          <TextField label="Assessment name" name="name" placeholder="Assessment 1 Peer Review" defaultValue={assessment?.name} />
          <TextField label="Unit code" name="unitCode" placeholder="COMP3000" defaultValue={assessment?.unitCode} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Academic year" name="semesterYear" defaultValue={storedYear}>
            {semesterYears.map((year) => <option key={year} value={year}>{year}</option>)}
          </SelectField>
          <SelectField label="Semester" name="semesterPeriod" defaultValue={storedPeriod}>
            <option value="S1">Semester 1 (S1)</option>
            <option value="S2">Semester 2 (S2)</option>
          </SelectField>
        </div>
      </FormSection>

      <FormSection number="2" title="Weighting" description="Set how much the assessment and teamwork process contribute to the final grade.">
        <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Assessment weighting within the unit"
          help="Example: Assessment 1 is worth 40% of the final grade."
          name="assessmentWeighting"
          defaultValue={assessment?.assessmentWeighting ?? 40}
          suffix="%"
          max={100}
        />
        <NumberField
          label="Process Weighting"
          help="Example: 50% of a 40% assessment means the process component is worth 20% overall."
          name="processWeighting"
          defaultValue={assessment?.processWeighting ?? 50}
          suffix="%"
          max={100}
        />
        </div>
      </FormSection>

      <FormSection number="3" title="Cohort and staffing" description="These values help plan group capacity and educator allocation.">
        <div className="grid gap-4 sm:grid-cols-3"><NumberField label="Cohort size" name="cohortSize" defaultValue={assessment?.cohortSize ?? 120} /><NumberField label="Students per group" name="studentsPerGroup" min={1} defaultValue={assessment?.studentsPerGroup ?? 5} /><NumberField label="Number of educators" name="educatorCount" defaultValue={assessment?.educatorCount ?? 4} /></div>
      </FormSection>

      <FormSection number="4" title="Deadline schedule" description="Build the recurring weekly submission timetable.">
        <div className="grid gap-4 sm:grid-cols-2"><SelectField label="Repeat type" name="repeatType" defaultValue={assessment?.repeatType ?? "WEEKLY"}>
          <option value="WEEKLY">Weekly</option>
          <option value="FORTNIGHTLY">Fortnightly</option>
        </SelectField>
        <SelectField label="Deadline day" name="deadlineDay" defaultValue={assessment?.deadlineDay ?? "SUNDAY"}>
          {deadlineDays.map((day) => (
            <option key={day} value={day.toUpperCase()}>
              {day}
            </option>
          ))}
        </SelectField><TextField label="Deadline time" name="deadlineTime" type="time" defaultValue={assessment?.deadlineTime ?? "23:55"} /><TextField label="Number of weeks" name="weeks" type="number" min={minimumWeeks} defaultValue={String(assessment?.numberOfWeeks ?? 13)} /><TextField label="Start date" name="startDate" type="date" defaultValue={assessment?.startDate.toISOString().slice(0, 10) ?? today} /></div>
        <p className="text-xs text-brand-muted">Week 1 opens on the start date. Each following week opens when the previous week reaches its submission deadline.</p>
        {minimumWeeks > 1 && <p className="text-xs text-brand-muted">This assessment must retain at least {minimumWeeks} weeks because Week {minimumWeeks} contains submissions.</p>}
      </FormSection>

      <fieldset className="border-t border-brand-border px-6 py-7 sm:px-8">
        <legend className="sr-only">Feedback visibility</legend>
        <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">5</span><div><h2 className="font-bold">Feedback visibility</h2><p className="mt-1 text-sm text-brand-muted">Choose when peer comments become available to students.</p></div></div>
        <div className="mt-4 space-y-3">
          <RadioOption
            name="feedbackVisibility"
            value="IMMEDIATE_AFTER_SUBMISSION"
            label="Students can see peer feedback immediately after submitting"
            defaultChecked={!assessment || assessment.feedbackVisibility === "IMMEDIATE_AFTER_SUBMISSION"}
            required={!assessment || assessment.feedbackVisibility === "IMMEDIATE_AFTER_SUBMISSION"}
          />
          <RadioOption
            name="feedbackVisibility"
            value="AFTER_DEADLINE"
            label="Students can see peer feedback only after the weekly deadline"
            defaultChecked={assessment?.feedbackVisibility === "AFTER_DEADLINE"}
            disabled
            badge="Temporarily unavailable"
          />
        </div>
      </fieldset>

      <div className="flex flex-col gap-3 border-t border-brand-border bg-brand-background px-6 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <button className="focus-ring w-full rounded-lg bg-brand-primary px-6 py-3 font-semibold text-white shadow-sm hover:opacity-90 sm:w-auto">
          {assessment ? "Save changes" : "Continue to educator allocation"}
        </button>
      </div>
    </form>
  );
}

function FormSection({ number, title, description, children }: { number: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-brand-border px-6 py-7 first:border-t-0 sm:px-8">
      <div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-primary text-sm font-bold text-white">{number}</span><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-sm text-brand-muted">{description}</p></div></div>
      <div className="mt-5 space-y-4 rounded-xl border border-brand-border bg-brand-background/40 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function TextField({
  label,
  name,
  placeholder,
  type = "text",
  defaultValue,
  min,
}: {
  label: string;
  name: string;
  placeholder?: string;
  type?: string;
  defaultValue?: string;
  min?: number;
}) {
  return (
    <label className="block text-sm font-semibold">
      <span>{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        required
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
  min = 0,
  max,
}: {
  label: string;
  name: string;
  defaultValue: number;
  suffix?: string;
  help?: string;
  min?: number;
  max?: number;
}) {
  return (
    <label className="block text-sm font-semibold">
      <span>{label}</span>
      {help && <span className="mt-1 block text-xs font-normal leading-5 text-brand-muted sm:min-h-10">{help}</span>}
      <div className="mt-2 flex h-11 overflow-hidden rounded-lg border border-brand-border bg-white">
        <input name={name} type="number" min={min} max={max} required defaultValue={defaultValue} className="focus-ring w-full border-0 px-3 font-normal outline-none" />
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
      <select name={name} required defaultValue={defaultValue} className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal">
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
  disabled = false,
  badge,
  required = false,
}: {
  name: string;
  value: string;
  label: string;
  defaultChecked?: boolean;
  disabled?: boolean;
  badge?: string;
  required?: boolean;
}) {
  return (
    <label className={`flex items-start gap-3 rounded-xl border px-4 py-4 text-sm font-semibold ${disabled ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400" : "border-brand-border bg-white hover:border-brand-primary/50"}`}>
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} disabled={disabled} required={required} className="mt-0.5 h-4 w-4 shrink-0" />
      <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-2"><span>{label}</span>{badge && <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">{badge}</span>}</span>
    </label>
  );
}
