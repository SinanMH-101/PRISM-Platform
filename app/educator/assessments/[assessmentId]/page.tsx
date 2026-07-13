import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireEducator } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGroupAction } from "../../actions";

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
  const studentSlots = Array.from({ length: assessment.studentsPerGroup }, (_, index) => index + 1);

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

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-7 lg:grid-cols-[380px_1fr]">
        <aside className="space-y-5">
          <section className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
            <p className="text-sm font-semibold text-brand-primary">{assessment.unitCode}</p>
            <h1 className="mt-1 text-3xl font-bold">{assessment.name}</h1>
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

          <section className="rounded-lg border border-brand-border bg-brand-surface p-5 shadow-soft">
            <h2 className="text-xl font-bold">Create group</h2>
            <form action={createGroupAction} className="mt-5 space-y-4">
              <input type="hidden" name="assessmentId" value={assessment.id} />
              <label className="block text-sm font-semibold">
                Group name
                <input name="groupName" placeholder="Group 1" className="focus-ring mt-2 h-11 w-full rounded-lg border border-brand-border px-3 font-normal" />
              </label>

              <div className="space-y-3">
                {studentSlots.map((slot) => (
                  <div key={slot} className="rounded-lg border border-brand-border p-3">
                    <p className="text-sm font-semibold">Student {slot}</p>
                    <label className="mt-3 block text-sm font-semibold">
                      Name
                      <input name="studentName" className="focus-ring mt-2 h-10 w-full rounded-lg border border-brand-border px-3 font-normal" />
                    </label>
                    <label className="mt-3 block text-sm font-semibold">
                      Email
                      <input name="studentEmail" type="email" className="focus-ring mt-2 h-10 w-full rounded-lg border border-brand-border px-3 font-normal" />
                    </label>
                  </div>
                ))}
              </div>

              <button className="focus-ring w-full rounded-lg bg-brand-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90">
                Create group
              </button>
            </form>
          </section>
        </aside>

        <section className="rounded-lg border border-brand-border bg-brand-surface shadow-soft">
          <div className="border-b border-brand-border p-5">
            <h2 className="text-xl font-bold">Groups</h2>
            <p className="mt-1 text-sm text-brand-muted">Groups are empty until educators create them and add students.</p>
          </div>

          <div className="divide-y divide-brand-border">
            {groups.length === 0 && <p className="p-6 text-sm text-brand-muted">No groups have been created for this assessment yet.</p>}

            {groups.map((group) => (
              <article key={group.id} className="p-5">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h3 className="text-lg font-bold">{group.name}</h3>
                    <p className="text-sm text-brand-muted">{group.className}</p>
                  </div>
                  <span className="rounded-full bg-brand-background px-3 py-1 text-xs font-bold text-brand-muted">
                    {group.members.length}/{assessment.studentsPerGroup} students
                  </span>
                </div>

                <div className="mt-4 overflow-hidden rounded-lg border border-brand-border">
                  <table className="w-full min-w-[520px] border-collapse text-left text-sm">
                    <thead className="bg-brand-background text-brand-muted">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Student</th>
                        <th className="px-4 py-3 font-semibold">Email</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border bg-white">
                      {group.members.length === 0 && (
                        <tr>
                          <td colSpan={2} className="px-4 py-4 text-brand-muted">
                            No students in this group yet.
                          </td>
                        </tr>
                      )}
                      {group.members.map((member) => (
                        <tr key={member.id}>
                          <td className="px-4 py-4 font-semibold">{member.student.name}</td>
                          <td className="px-4 py-4 text-brand-muted">{member.student.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
