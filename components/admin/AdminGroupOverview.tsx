type Group = {
  id: string;
  name: string;
  className: string;
  capacityOverride: number | null;
  educator: { name: string } | null;
  members: { id: string; student: { name: string; email: string; studentId: string | null } }[];
};

export default function AdminGroupOverview({ groups, studentsPerGroup }: { groups: Group[]; studentsPerGroup: number }) {
  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-5"><h2 className="text-2xl font-bold">Groups</h2></div>
      {groups.length === 0 ? <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface p-10 text-center shadow-soft"><h3 className="font-bold">No groups created</h3><p className="mt-2 text-sm text-brand-muted">Groups will appear here after a TA creates them.</p></div> : (
        <div className="space-y-3">{groups.map((group) => <details key={group.id} className="group overflow-hidden rounded-lg border border-brand-border bg-brand-surface shadow-soft">
          <summary className="focus-ring flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden"><span aria-hidden="true" className="text-brand-muted transition-transform group-open:rotate-90">›</span><div className="min-w-0 flex-1"><h3 className="truncate font-bold">{group.name}</h3><p className="text-xs text-brand-muted">{group.className} · {group.members.length}/{group.capacityOverride ?? studentsPerGroup} students</p><p className="mt-1 text-xs font-semibold text-brand-primary">TA: {group.educator?.name ?? "Unassigned"}</p></div></summary>
          <div className="border-t border-brand-border px-5 py-4">{group.members.length === 0 ? <p className="text-sm text-brand-muted">No students in this group yet.</p> : <div className="divide-y divide-brand-border">{group.members.map((member) => <div key={member.id} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div><p className="font-semibold">{member.student.name}</p><p className="text-sm text-brand-muted">{member.student.email}</p></div><p className="text-sm text-brand-muted">ID: {member.student.studentId ?? "Not provided"}</p></div>)}</div>}</div>
        </details>)}</div>
      )}
    </section>
  );
}
