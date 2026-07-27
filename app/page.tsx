import { redirect } from "next/navigation";
import { getCurrentUser, getRoleHomePath } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword) redirect("/change-password");
  redirect(getRoleHomePath(user.role));
}
