import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { studentLogoutAction } from "../actions";
import { BrandIdentity } from "@/components/BrandingProvider";

export default async function StudentDashboardPage() {
  const student = await requireStudent();
  if (student.mustChangePassword) redirect("/change-password");

  const memberships = await prisma.groupMember.findMany({
    where: { studentId: student.id },
    include: {
      group: {
        include: {
          educator: true,
          class: { include: { assessment: true } },
        },
      },
    },
    orderBy: { group: { class: { assessment: { name: "asc" } } } },
  });

  const assessments = Array.from(
    new Map(
      memberships.map((membership) => {
        const assessment = membership.group.class.assessment;
        return [
          assessment.id,
          {
            assessment,
            group: membership.group,
            educatorName: membership.group.educator?.name ?? "Not assigned",
          },
        ];
      })
    ).values()
  );

  return (
    <main className="min-h-screen bg-brand-background text-brand-text">
      <nav className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <BrandIdentity subtitle={`Student dashboard · ${student.name}`} />
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-brand-background px-3 py-2 text-xs font-semibold text-brand-muted sm:inline-block">
              Student ID: {student.studentId ?? "Not provided"}
            </span>
            <form action={studentLogoutAction}>
              <button className="focus-ring rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold hover:bg-brand-background">
                Log out
              </button>
            </form>
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <div>
          <p className="text-sm font-semibold text-brand-primary">Your workspace</p>
          <h1 className="mt-1 text-3xl font-bold">Assessments</h1>
          <p className="mt-2 text-sm text-brand-muted">Assessments you have been invited to through your assigned groups.</p>
        </div>

        {assessments.length === 0 ? (
          <div className="mt-7 rounded-xl border border-dashed border-brand-border bg-brand-surface p-10 text-center shadow-soft">
            <h2 className="text-lg font-bold">No assessments yet</h2>
            <p className="mt-2 text-sm text-brand-muted">Your assessments will appear here after an educator adds you to a group.</p>
          </div>
        ) : (
          <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {assessments.map(({ assessment, group, educatorName }) => (
              <article key={assessment.id} className="flex flex-col rounded-xl border border-brand-border bg-brand-surface p-5 shadow-soft">
                <p className="text-sm font-bold text-brand-primary">{assessment.unitCode}</p>
                <h2 className="mt-1 text-xl font-bold">{assessment.name}</h2>
                <p className="mt-1 text-sm font-semibold text-brand-muted">{assessment.semester}</p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-brand-background p-3">
                    <p className="text-xs text-brand-muted">Educator in charge</p>
                    <p className="mt-1 font-semibold">{educatorName}</p>
                  </div>
                  <div className="rounded-lg bg-brand-background p-3">
                    <p className="text-xs text-brand-muted">Group</p>
                    <p className="mt-1 font-semibold">{group.name}</p>
                  </div>
                </div>
                <div className="mt-5 flex-1 border-t border-brand-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-muted">Status</p>
                  <p className="mt-1 text-sm font-semibold capitalize">{assessment.status.toLowerCase()}</p>
                </div>
                <Link href={`/student/assessments/${assessment.id}`} className="focus-ring mt-5 rounded-lg bg-brand-primary px-4 py-3 text-center text-sm font-semibold text-white hover:opacity-90">
                  Open assessment
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
