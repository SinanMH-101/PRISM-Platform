"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createEducatorAccountAction,
  invitePastedEducatorsAction,
  removeEducatorAction,
  resendEducatorInviteAction,
  type EducatorInviteActionState,
} from "@/app/admin/actions";
import type { InviteEmailPreview } from "@/lib/invites";

type EducatorRow = {
  id: string;
  name: string | null;
  email: string;
  status: string;
  invitedAt: string;
  lastSentAt: string | null;
};

const emptyState: EducatorInviteActionState = { previews: [] };

export default function EducatorInvitePanel({ assessmentId, educators }: { assessmentId: string; educators: EducatorRow[] }) {
  const router = useRouter();
  const [pastedState, pastedAction, pastedPending] = useActionState(invitePastedEducatorsAction, emptyState);
  const [manualState, manualAction, manualPending] = useActionState(createEducatorAccountAction, emptyState);
  const [resendState, resendAction, resendPending] = useActionState(resendEducatorInviteAction, emptyState);
  const [previews, setPreviews] = useState<InviteEmailPreview[]>([]);

  useEffect(() => {
    const latest = [pastedState, manualState, resendState].find((state) => state.previews.length > 0);
    if (latest) setPreviews(latest.previews);
  }, [pastedState, manualState, resendState]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        router.refresh();
      }
    }, 3000);

    return () => window.clearInterval(interval);
  }, [router]);

  const error = pastedState.error ?? manualState.error ?? resendState.error;
  const message = pastedState.message ?? manualState.message ?? resendState.message;

  return (
    <div className="space-y-6">
      {previews.length > 0 && <EmailPreviewModal previews={previews} onClose={() => setPreviews([])} />}

      <section className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
        <h2 className="text-xl font-bold">Add educators</h2>
        {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
        {!error && message && <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</p>}

        <form action={pastedAction} className="mt-5 grid gap-4">
          <input type="hidden" name="assessmentId" value={assessmentId} />
          <label className="text-sm font-semibold">
            Paste email addresses
            <textarea
              name="emails"
              placeholder="jane.doe@university.edu"
              className="focus-ring mt-2 min-h-24 w-full resize-y rounded-lg border border-brand-border px-3 py-2 font-normal"
            />
          </label>
          <div>
            <button disabled={pastedPending} className="focus-ring rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {pastedPending ? "Sending invites..." : "Send pasted invites"}
            </button>
          </div>
        </form>

        <form action={manualAction} className="mt-6 grid gap-4 border-t border-brand-border pt-5">
          <input type="hidden" name="assessmentId" value={assessmentId} />
          <TextInput label="Name" name="name" />
          <TextInput label="Email" name="email" />
          <TextInput label="Optional generated/static password" name="password" />
          <div>
            <button disabled={manualPending} className="focus-ring rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold hover:bg-brand-background disabled:opacity-60">
              {manualPending ? "Creating..." : "Create account"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface shadow-soft">
        <div className="border-b border-brand-border p-5">
          <h2 className="text-xl font-bold">Educator invite status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-brand-background text-brand-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Educator name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Invite sent date</th>
                <th className="px-4 py-3 font-semibold">Last sent</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {educators.map((educator) => (
                <tr key={educator.id} className="bg-white">
                  <td className="px-4 py-4 font-semibold">{educator.name ?? "Not provided"}</td>
                  <td className="px-4 py-4 text-brand-muted">{educator.email}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full border px-2 py-1 text-xs font-bold capitalize ${statusBadgeClass(educator.status)}`}>
                      {educator.status.toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-brand-muted">{educator.invitedAt}</td>
                  <td className="px-4 py-4 text-brand-muted">{educator.lastSentAt ?? "Not sent"}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <form action={resendAction}>
                        <input type="hidden" name="assessmentId" value={assessmentId} />
                        <input type="hidden" name="id" value={educator.id} />
                        <button disabled={resendPending} className="focus-ring rounded-lg border border-brand-border px-3 py-2 font-semibold hover:bg-brand-background disabled:opacity-60">
                          Resend invite
                        </button>
                      </form>
                      <form action={removeEducatorAction}>
                        <input type="hidden" name="assessmentId" value={assessmentId} />
                        <input type="hidden" name="id" value={educator.id} />
                        <button className="focus-ring rounded-lg border border-brand-border px-3 py-2 font-semibold hover:bg-brand-background">Remove</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {educators.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-brand-muted">
                    No educators added yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "JOINED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "INVITED":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "REMOVED":
      return "border-slate-200 bg-slate-100 text-slate-600";
    default:
      return "border-brand-border bg-brand-background text-brand-muted";
  }
}

function EmailPreviewModal({ previews, onClose }: { previews: InviteEmailPreview[]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8">
      <section className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-soft">
        <div className="flex items-start justify-between gap-4 border-b border-brand-border p-5">
          <div>
            <h2 className="text-xl font-bold">Email preview</h2>
            <p className="mt-1 text-sm text-brand-muted">Review the invitation and the educator sign-in details.</p>
          </div>
          <button onClick={onClose} className="focus-ring rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold hover:bg-brand-background">
            Close
          </button>
        </div>
        <div className="space-y-4 p-5">
          {previews.map((preview) => (
            <article key={`${preview.to}-${preview.subject}`} className="rounded-lg border border-brand-border bg-brand-background p-4">
              <p className="text-xs font-semibold uppercase text-brand-muted">To</p>
              <p className="mt-1 font-semibold">{preview.to}</p>
              <p className="mt-3 text-xs font-semibold uppercase text-brand-muted">Subject</p>
              <p className="mt-1 font-semibold">{preview.subject}</p>
              <div className="mt-4 overflow-hidden rounded-lg border border-brand-border bg-white">
                <div dangerouslySetInnerHTML={{ __html: preview.htmlBody }} />
              </div>
              <div className="mt-3 rounded-lg bg-white p-3 text-sm">
                <p>
                  <span className="font-semibold">Username:</span> {preview.username}
                </p>
                {preview.temporaryPassword && (
                  <p className="mt-1">
                    <span className="font-semibold">Temporary password:</span> {preview.temporaryPassword}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function TextInput({ label, name }: { label: string; name: string }) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input name={name} className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal" />
    </label>
  );
}
