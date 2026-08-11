"use client";

import { useActionState, useMemo, useState } from "react";
import {
  deleteAccountAction,
  resetAccountPasswordAction,
  type AccountActionState,
} from "@/app/admin/accounts/actions";

type Account = {
  id: string;
  name: string;
  email: string;
  username: string | null;
  studentId: string | null;
  role: "EDUCATOR" | "STUDENT";
  mustChangePassword: boolean;
  createdAt: string;
  _count: { groupMemberships: number; submissions: number; assessmentEducators: number };
};

const emptyState: AccountActionState = {};

export default function AccountsPanel({ accounts }: { accounts: Account[] }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"ALL" | Account["role"]>("ALL");
  const [resetState, resetAction, resetPending] = useActionState(resetAccountPasswordAction, emptyState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteAccountAction, emptyState);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return accounts.filter(
      (account) =>
        (role === "ALL" || account.role === role) &&
        (!needle || [account.name, account.email, account.username, account.studentId].some((value) => value?.toLowerCase().includes(needle)))
    );
  }, [accounts, query, role]);

  const error = resetState.error ?? deleteState.error;
  const message = resetState.message ?? deleteState.message;

  return (
    <div className="space-y-5">
      {(error || message) && (
        <p className={`rounded-lg border px-4 py-3 text-sm font-semibold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {error ?? message}
        </p>
      )}

      <section className="grid gap-3 rounded-lg border border-brand-border bg-brand-surface p-4 shadow-soft sm:grid-cols-[minmax(0,1fr)_200px]">
        <label className="text-sm font-semibold">
          Search accounts
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, username or student ID" className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal" />
        </label>
        <label className="text-sm font-semibold">
          Role
          <select value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border bg-white px-3 font-normal">
            <option value="ALL">All accounts</option>
            <option value="EDUCATOR">TAs</option>
            <option value="STUDENT">Students</option>
          </select>
        </label>
      </section>

      <p className="text-sm text-brand-muted">Showing {filtered.length} of {accounts.length} accounts.</p>

      <div className="space-y-4">
        {filtered.map((account) => (
          <article key={account.id} className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">{account.name}</h2>
                  <span className="rounded-full border border-brand-border bg-brand-background px-2 py-1 text-xs font-bold">{account.role === "EDUCATOR" ? "TA" : "Student"}</span>
                  {account.mustChangePassword && <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">Password change required</span>}
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <Detail label="Email" value={account.email} />
                  <Detail label="Username" value={account.username ?? "Not set"} />
                  <Detail label="Student ID" value={account.studentId ?? "Not applicable"} />
                  <Detail label="Created" value={account.createdAt} />
                  <Detail label="Group memberships" value={String(account._count.groupMemberships)} />
                  <Detail label="Submissions" value={String(account._count.submissions)} />
                  <Detail label="Assessment allocations" value={String(account._count.assessmentEducators)} />
                </dl>
              </div>

              <div className="space-y-4">
                <form action={resetAction} className="rounded-lg border border-brand-border bg-brand-background p-4">
                  <input type="hidden" name="userId" value={account.id} />
                  <label className="text-sm font-semibold">
                    New temporary password
                    <input name="password" type="password" minLength={8} required autoComplete="new-password" className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border bg-white px-3 font-normal" />
                  </label>
                  <button disabled={resetPending} className="focus-ring mt-3 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
                    {resetPending ? "Resetting..." : "Reset password"}
                  </button>
                </form>

                <form
                  action={deleteAction}
                  onSubmit={(event) => {
                    if (!window.confirm(`Delete ${account.name}'s account? They will immediately lose access. Historical assessment records will remain.`)) event.preventDefault();
                  }}
                >
                  <input type="hidden" name="userId" value={account.id} />
                  <button disabled={deletePending} className="focus-ring rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60">
                    {deletePending ? "Deleting..." : "Delete account"}
                  </button>
                </form>
              </div>
            </div>
          </article>
        ))}
        {filtered.length === 0 && <div className="rounded-lg border border-dashed border-brand-border p-10 text-center text-sm text-brand-muted">No matching accounts.</div>}
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-brand-muted">{label}</dt>
      <dd className="mt-1 break-words font-medium">{value}</dd>
    </div>
  );
}
