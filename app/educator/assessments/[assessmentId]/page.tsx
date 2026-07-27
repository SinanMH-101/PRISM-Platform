import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireEducator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GroupManager from "@/components/educator/GroupManager";

export default async function EducatorAssessmentPage({ params }: { params: Promise<{ assessmentId: string }> }) {
  const educator = await requireEducator();
  if (educator.mustChangePassword) redirect("/change-password");

  const { assessmentId } = await params;
  const invite = await prisma.assessmentEducator.findFirst({
    where: {
      assessmentId,
      userId: educator.id,
      status: "JOINED",
      removedAt: null,
    },
    include: {
      assessment: {
        include: {
          classes: {
            include: {
              groups: {
                include: {
                  members: {
                    include: { student: true },
                    orderBy: { student: { name: "asc" } },
                  },
                },
                orderBy: { name: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!invite) notFound();

  const assessment = invite.assessment;
  const groups = assessment.classes.flatMap((assessmentClass) =>
    assessmentClass.groups.map((group) => ({ ...group, className: assessmentClass.name }))
  );
  return (
    <main className="min-h-screen bg-brand-background text-brand-text">
      <nav className="border-b border-brand-border bg-brand-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Educator workspace</p>
            <p className="text-xs text-brand-muted">Signed in as {educator.name}</p>
          </div>
          <Link href="/educator" className="focus-ring rounded-lg border border-brand-border px-3 py-2 text-sm font-semibold hover:bg-brand-background">
            Back to assessments
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-6xl items-start gap-6 px-5 py-7 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-6">
          <section className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
            <p className="text-sm font-semibold text-brand-primary">{assessment.unitCode}</p>
            <h1 className="mt-1 text-3xl font-bold">{assessment.name}</h1>
            <p className="mt-1 text-sm text-brand-muted">{assessment.semester}</p>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="rounded-lg bg-brand-background p-3">
                <p className="font-semibold">Students per group</p>
                <p className="mt-1 text-brand-muted">{assessment.studentsPerGroup}</p>
              </div>
              <div className="rounded-lg bg-brand-background p-3">
                <p className="font-semibold">Groups created</p>
                <p className="mt-1 text-brand-muted">{groups.length}</p>
              </div>
            </div>
          </section>
        </aside>

        <div className="flex min-w-0 justify-center">
          <GroupManager assessmentId={assessment.id} studentsPerGroup={assessment.studentsPerGroup} groups={groups} />
        </div>
      </section>
    </main>
  );
}
