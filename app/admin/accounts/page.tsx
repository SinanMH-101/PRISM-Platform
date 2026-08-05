import AccountsPanel from "@/components/admin/AccountsPanel";
import { prisma } from "@/lib/prisma";

export default async function AdminAccountsPage() {
  const accounts = await prisma.user.findMany({
    where: { role: { in: ["EDUCATOR", "STUDENT"] }, deletedAt: null },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      studentId: true,
      role: true,
      mustChangePassword: true,
      createdAt: true,
      _count: { select: { groupMemberships: true, submissions: true, assessmentEducators: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-primary">Admin</p>
        <h1 className="mt-1 text-3xl font-bold">Accounts</h1>
   
      </div>
      <AccountsPanel
        accounts={accounts.map((account) => ({
          ...account,
          role: account.role as "EDUCATOR" | "STUDENT",
          createdAt: account.createdAt.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }),
        }))}
      />
    </div>
  );
}
