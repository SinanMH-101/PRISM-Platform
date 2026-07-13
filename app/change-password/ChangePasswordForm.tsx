"use client";

import { useActionState } from "react";
import { changePasswordAction } from "./actions";

export default function ChangePasswordForm() {
  const [error, formAction, pending] = useActionState(changePasswordAction, null);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <label className="block text-sm font-semibold">
        New password
        <input name="password" type="password" className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal" />
      </label>
      <label className="block text-sm font-semibold">
        Confirm password
        <input name="confirmPassword" type="password" className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal" />
      </label>
      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p>}
      <button disabled={pending} className="focus-ring w-full rounded-lg bg-brand-primary px-4 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60">
        {pending ? "Saving..." : "Save password"}
      </button>
    </form>
  );
}
