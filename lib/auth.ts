import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { verifyPassword } from "./password";

export const sessionCookieName = "prism_session";
const sessionDays = 7;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  cookieStore.delete(sessionCookieName);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt <= new Date()) {
    if (session) await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return session.user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  return user;
}

export async function requireEducator() {
  const user = await getCurrentUser();

  if (!user || user.role !== "EDUCATOR") {
    redirect("/login");
  }

  return user;
}

export async function authenticate(username: string, password: string) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email: username.toLowerCase() }],
    },
  });

  if (!user?.passwordHash) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  return valid ? user : null;
}
