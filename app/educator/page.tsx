import { redirect } from "next/navigation";
import Link from "next/link";
import { requireEducator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BrandIdentity } from "@/components/BrandingProvider";
import { educatorLogoutAction, joinAssessmentAction } from "./actions";

export default async function EducatorPage() {
  const user = await requireEducator();
  if (user.mustChangePassword) redirect("/change-password");

  const invites = await prisma.assessmentEducator.findMany({
    where: { userId: user.id, removedAt: null, assessment: { deletedAt: null } },
    include: { assessment: true },
    orderBy: { invitedAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-brand-background text-brand-text">
      <nav className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <BrandIdentity subtitle={`Educator workspace · ${user.name}`} />
          <form action={educatorLogoutAction}>
            <button className="focus-ring rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold hover:bg-brand-background">Log out</button>
          </form>
        </div>
      </nav>
      <section className="mx-auto max-w-5xl space-y-5 px-5 py-7">
        <div>
          <p className="text-sm font-semibold text-brand-primary">Educator</p>
          <h1 className="mt-1 text-3xl font-bold">My assessments</h1>
        </div>

        {invites.length === 0 && <p className="rounded-lg border border-brand-border bg-brand-surface p-5 text-brand-muted shadow-soft">No assessments yet.</p>}

        <div className="grid gap-4">
          {invites.map((invite) => (
            <article key={invite.id} className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-brand-primary">{invite.assessment.unitCode}</p>
                  <h2 className="mt-1 text-2xl font-bold">{invite.assessment.name}</h2>
                  <p className="mt-1 text-sm text-brand-muted">{invite.assessment.semester}</p>
                  <p className="mt-2 text-sm capitalize text-brand-muted">Status: {invite.status.toLowerCase()}</p>
                </div>
                {invite.status === "JOINED" ? (
                  <Link
                    href={`/educator/assessments/${invite.assessmentId}`}
                    className="focus-ring rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
                  >
                    Enter assessment
                  </Link>
                ) : (
                  <form action={joinAssessmentAction}>
                    <input type="hidden" name="inviteId" value={invite.id} />
                    <button className="focus-ring rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
                      Join assessment
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
