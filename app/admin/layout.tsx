import AdminShell from "@/components/admin/AdminShell";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireAdmin();
  return <AdminShell userName={user.username ?? user.name}>{children}</AdminShell>;
}
