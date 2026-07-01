"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Educator } from "./data";

function splitEmails(input: string) {
  return Array.from(new Set(input.split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))));
}

function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export default function EducatorInvitePanel({ initialEducators }: { initialEducators: Educator[] }) {
  const [educators, setEducators] = useState(initialEducators);
  const [pastedEmails, setPastedEmails] = useState("");
  const [manual, setManual] = useState({ name: "", email: "", password: "" });

  function addEmails(emails: string[]) {
    if (emails.length === 0) return;
    const known = new Set(educators.map((educator) => educator.email));
    const additions = emails
      .filter((email) => !known.has(email))
      .map((email) => ({
        id: `local-${email}`,
        assessmentId: "local",
        name: nameFromEmail(email),
        email,
        status: "invited" as const,
        inviteSentDate: new Date().toISOString().slice(0, 10),
      }));
    setEducators((current) => [...current, ...additions]);
  }

  function invitePasted() {
    addEmails(splitEmails(pastedEmails));
    setPastedEmails("");
  }

  function uploadCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then((text) => addEmails(splitEmails(text)));
    event.target.value = "";
  }

  function createManualAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const email = manual.email.trim().toLowerCase();
    const name = manual.name.trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setEducators((current) => [
      { id: `manual-${email}`, assessmentId: "local", name, email, status: "invited", inviteSentDate: new Date().toISOString().slice(0, 10) },
      ...current.filter((educator) => educator.email !== email),
    ]);
    setManual({ name: "", email: "", password: "" });
  }

  function removeEducator(email: string) {
    setEducators((current) => current.filter((educator) => educator.email !== email));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
        <h2 className="text-xl font-bold">Add educators</h2>
        <div className="mt-5 grid gap-4">
          <label className="text-sm font-semibold">
            Paste email addresses
            <textarea
              value={pastedEmails}
              onChange={(event) => setPastedEmails(event.target.value)}
              placeholder="alex.smith@university.edu, priya.rao@university.edu"
              className="focus-ring mt-2 min-h-24 w-full resize-y rounded-lg border border-brand-border px-3 py-2 font-normal"
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={invitePasted} className="focus-ring rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
              Send pasted invites
            </button>
            <label className="focus-ring cursor-pointer rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold hover:bg-brand-background">
              Upload CSV
              <input type="file" accept=".csv,text/csv" onChange={uploadCsv} className="sr-only" />
            </label>
          </div>
        </div>

        <form onSubmit={createManualAccount} className="mt-6 grid gap-4 border-t border-brand-border pt-5 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
          <TextInput label="Name" value={manual.name} onChange={(value) => setManual((current) => ({ ...current, name: value }))} />
          <TextInput label="Email" value={manual.email} onChange={(value) => setManual((current) => ({ ...current, email: value }))} />
          <TextInput label="Optional generated/static password" value={manual.password} onChange={(value) => setManual((current) => ({ ...current, password: value }))} />
          <button className="focus-ring rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold hover:bg-brand-background">
            Create account
          </button>
        </form>
      </section>

      <section className="overflow-hidden rounded-lg border border-brand-border bg-brand-surface shadow-soft">
        <div className="border-b border-brand-border p-5">
          <h2 className="text-xl font-bold">Educator invite status</h2>
          <p className="mt-1 text-sm text-brand-muted">Invite links bring educators to the login page. Email delivery is mocked in this prototype.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-brand-background text-brand-muted">
              <tr>
                <th className="px-4 py-3 font-semibold">Educator name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Invite sent date</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {educators.map((educator) => (
                <tr key={educator.email} className="bg-white">
                  <td className="px-4 py-4 font-semibold">{educator.name}</td>
                  <td className="px-4 py-4 text-brand-muted">{educator.email}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-brand-background px-2 py-1 text-xs font-bold capitalize text-brand-muted">{educator.status}</span>
                  </td>
                  <td className="px-4 py-4 text-brand-muted">{educator.inviteSentDate}</td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button className="focus-ring rounded-lg border border-brand-border px-3 py-2 font-semibold hover:bg-brand-background">Resend invite</button>
                      <button onClick={() => removeEducator(educator.email)} className="focus-ring rounded-lg border border-brand-border px-3 py-2 font-semibold hover:bg-brand-background">
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {educators.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-brand-muted">
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

function TextInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="focus-ring mt-2 w-full rounded-lg border border-brand-border px-3 py-2 font-normal" />
    </label>
  );
}
