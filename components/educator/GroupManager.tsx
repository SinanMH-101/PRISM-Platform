"use client";

import { useActionState, useEffect, useState } from "react";
import { addStudentAction, createGroupAction, deleteGroupAction, type AddStudentActionState } from "@/app/educator/actions";

type Group = {
  id: string;
  name: string;
  className: string;
  members: { id: string; student: { name: string; email: string; studentId: string | null } }[];
};

function PlusIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>;
}

function TrashIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5" /></svg>;
}

export default function GroupManager({ assessmentId, studentsPerGroup, groups }: { assessmentId: string; studentsPerGroup: number; groups: Group[] }) {
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [addingTo, setAddingTo] = useState<Group | null>(null);
  const [credentials, setCredentials] = useState<AddStudentActionState | null>(null);
  const [studentState, studentAction, studentPending] = useActionState(addStudentAction, { status: "idle" } as AddStudentActionState);

  useEffect(() => {
    if (studentState.status === "success") {
      setAddingTo(null);
      setCredentials(studentState);
    }
  }, [studentState]);

  return (
    <section className="mx-auto w-full max-w-3xl">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Groups</h2>
          <p className="mt-1 text-sm text-brand-muted">Create groups, then add students from each group row.</p>
        </div>
        {groups.length > 0 && (
          <button type="button" onClick={() => setCreatingGroup(true)} className="focus-ring flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
            <PlusIcon /> Create group
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-dashed border-brand-border bg-brand-surface p-8 text-center shadow-soft">
          <div>
            <button type="button" aria-label="Create a new group" onClick={() => setCreatingGroup(true)} className="focus-ring mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-primary text-white shadow-soft hover:opacity-90">
              <PlusIcon />
            </button>
            <h2 className="mt-5 text-xl font-bold">Create your first group</h2>
            <p className="mt-2 text-sm text-brand-muted">Start by giving the group a name.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <details key={group.id} className="group overflow-hidden rounded-lg border border-brand-border bg-brand-surface shadow-soft">
              <summary className="focus-ring flex cursor-pointer list-none items-center gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span aria-hidden="true" className="text-brand-muted transition-transform group-open:rotate-90">›</span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold">{group.name}</h3>
                  <p className="text-xs text-brand-muted">{group.members.length}/{studentsPerGroup} students</p>
                </div>
                <button type="button" aria-label={`Add student to ${group.name}`} disabled={group.members.length >= studentsPerGroup} onClick={(event) => { event.preventDefault(); setAddingTo(group); }} className="focus-ring rounded-lg border border-brand-border p-2 text-brand-primary hover:bg-brand-background disabled:cursor-not-allowed disabled:opacity-40">
                  <PlusIcon />
                </button>
                <form action={deleteGroupAction} onSubmit={(event) => { if (!window.confirm(`Delete ${group.name}? Its student memberships will also be removed.`)) event.preventDefault(); }}>
                  <input type="hidden" name="assessmentId" value={assessmentId} />
                  <input type="hidden" name="groupId" value={group.id} />
                  <button aria-label={`Delete ${group.name}`} onClick={(event) => event.stopPropagation()} className="focus-ring rounded-lg border border-brand-border p-2 text-red-600 hover:bg-red-50"><TrashIcon /></button>
                </form>
              </summary>
              <div className="border-t border-brand-border px-5 py-4">
                {group.members.length === 0 ? <p className="text-sm text-brand-muted">No students in this group yet.</p> : (
                  <div className="divide-y divide-brand-border">
                    {group.members.map((member) => (
                      <div key={member.id} className="grid gap-1 py-3 sm:grid-cols-[1fr_auto] sm:items-center sm:gap-x-6">
                        <span className="font-semibold">{member.student.name}</span>
                        <span className="text-sm font-medium text-brand-muted">ID: {member.student.studentId ?? "Not provided"}</span>
                        <span className="text-sm text-brand-muted sm:col-span-2">{member.student.email}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </details>
          ))}
        </div>
      )}

      {creatingGroup && (
        <Modal title="Create group" onClose={() => setCreatingGroup(false)}>
          <form action={createGroupAction} onSubmit={() => setCreatingGroup(false)} className="space-y-5">
            <input type="hidden" name="assessmentId" value={assessmentId} />
            <label className="block text-sm font-semibold">Group name<input autoFocus required name="groupName" placeholder="e.g. Group 1" className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal" /></label>
            <FormButtons onCancel={() => setCreatingGroup(false)} submitLabel="Create group" />
          </form>
        </Modal>
      )}

      {addingTo && (
        <Modal title={`Add student to ${addingTo.name}`} onClose={() => setAddingTo(null)}>
          <form action={studentAction} className="space-y-4">
            <input type="hidden" name="assessmentId" value={assessmentId} />
            <input type="hidden" name="groupId" value={addingTo.id} />
            <label className="block text-sm font-semibold">Student name<input autoFocus required name="studentName" autoComplete="name" className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal" /></label>
            <label className="block text-sm font-semibold">Student ID<input required name="studentId" autoComplete="off" placeholder="e.g. 12345678" className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal" /></label>
            <label className="block text-sm font-semibold">Student email<input required name="studentEmail" type="email" autoComplete="email" className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal" /></label>
            {studentState.status === "error" && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{studentState.message}</p>}
            <FormButtons onCancel={() => setAddingTo(null)} submitLabel={studentPending ? "Adding..." : "Add student"} disabled={studentPending} />
          </form>
        </Modal>
      )}

      {credentials?.status === "success" && (
        <Modal title={credentials.accountCreated ? "Student account created" : "Existing student account found"} onClose={() => setCredentials(null)}>
          <div className="space-y-4">
            <p className="text-sm text-brand-muted">
              {credentials.accountCreated
                ? `${credentials.name} can sign in at /login with the temporary credentials below.`
                : `${credentials.name} has been added to the group and should sign in at /login with their existing password.`}
            </p>
            <div className="space-y-3 rounded-lg bg-brand-background p-4 text-sm">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Username</p><p className="mt-1 break-all font-mono font-semibold">{credentials.username}</p></div>
              {credentials.temporaryPassword && <div><p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Temporary password</p><p className="mt-1 break-all font-mono font-semibold">{credentials.temporaryPassword}</p></div>}
            </div>
            {credentials.temporaryPassword && <p className="text-sm font-medium text-amber-700">Copy these credentials now. The student will be asked to change the temporary password after signing in.</p>}
            {!credentials.temporaryPassword && <p className="text-sm text-brand-muted">For security, existing passwords cannot be viewed or included in this popup.</p>}
            <div className="flex justify-end"><button type="button" onClick={() => setCredentials(null)} className="focus-ring rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white">Done</button></div>
          </div>
        </Modal>
      )}
    </section>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return <div role="dialog" aria-modal="true" aria-labelledby="modal-title" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="w-full max-w-md rounded-xl bg-brand-surface p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h2 id="modal-title" className="text-xl font-bold">{title}</h2><button type="button" aria-label="Close" onClick={onClose} className="focus-ring rounded-lg p-2 text-2xl leading-none text-brand-muted hover:bg-brand-background">×</button></div>{children}</div></div>;
}

function FormButtons({ onCancel, submitLabel, disabled = false }: { onCancel: () => void; submitLabel: string; disabled?: boolean }) {
  return <div className="flex justify-end gap-3 pt-1"><button type="button" onClick={onCancel} className="focus-ring rounded-lg border border-brand-border px-4 py-2.5 text-sm font-semibold">Cancel</button><button disabled={disabled} className="focus-ring rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-wait disabled:opacity-60">{submitLabel}</button></div>;
}
