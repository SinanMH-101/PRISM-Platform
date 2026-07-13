import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";
import { hashPassword } from "./password";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InviteEmailPreview = {
  to: string;
  subject: string;
  kind: "existing-user-invite" | "new-user-credentials";
  username: string;
  temporaryPassword?: string;
  body: string;
};

export type InviteEducatorsResult = {
  emailsProcessed: number;
  previews: InviteEmailPreview[];
  skipped: string[];
};

export function splitEducatorEmails(input: string) {
  return Array.from(
    new Set(
      input
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter((email) => emailPattern.test(email))
    )
  );
}

export function isValidEmail(email: string) {
  return emailPattern.test(email);
}

export function nameFromEmail(email: string) {
  return email
    .split("@")[0]
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%";
  const bytes = randomBytes(18);
  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function buildPreview({
  email,
  assessmentName,
  unitCode,
  username,
  temporaryPassword,
}: {
  email: string;
  assessmentName: string;
  unitCode: string;
  username: string;
  temporaryPassword?: string;
}): InviteEmailPreview {
  const subject = `Invitation: ${unitCode} ${assessmentName}`;

  if (temporaryPassword) {
    return {
      to: email,
      subject,
      kind: "new-user-credentials",
      username,
      temporaryPassword,
      body: [
        `An educator account has been created for ${unitCode} ${assessmentName}.`,
        "",
        `Username: ${username}`,
        `Temporary password: ${temporaryPassword}`,
        "",
        "Sign in at /login. You will be asked to change this password after login.",
      ].join("\n"),
    };
  }

  return {
    to: email,
    subject,
    kind: "existing-user-invite",
    username,
    body: [
      `You have been invited to assess ${unitCode} ${assessmentName}.`,
      "",
      `Sign in at /login with your existing account: ${username}`,
    ].join("\n"),
  };
}

export async function inviteEducatorsToAssessment(assessmentId: string, emails: string[]): Promise<InviteEducatorsResult> {
  const assessment = await prisma.assessment.findUnique({
    where: { id: assessmentId },
    select: { id: true, name: true, unitCode: true },
  });

  if (!assessment) {
    return { emailsProcessed: 0, previews: [], skipped: emails };
  }

  const previews: InviteEmailPreview[] = [];
  const skipped: string[] = [];

  for (const email of emails) {
    if (!isValidEmail(email)) {
      skipped.push(email);
      continue;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    const inviteToken = randomBytes(32).toString("hex");
    const inviteExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    let username = existingUser?.username ?? email;
    let temporaryPassword: string | undefined;

    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          name: nameFromEmail(email),
          email,
          username,
          role: "EDUCATOR",
          passwordHash: await hashPassword((temporaryPassword = generateTemporaryPassword())),
          mustChangePassword: true,
        },
      }));

    if (existingUser && existingUser.role !== "EDUCATOR") {
      await prisma.user.update({ where: { id: existingUser.id }, data: { role: "EDUCATOR" } });
    }

    username = user.username ?? user.email;

    await prisma.assessmentEducator.upsert({
      where: { assessmentId_email: { assessmentId, email } },
      update: {
        userId: user.id,
        name: user.name,
        status: "INVITED",
        inviteToken,
        inviteTokenHash: hashToken(inviteToken),
        inviteExpiresAt: inviteExpiry,
        invitedAt: new Date(),
        lastSentAt: new Date(),
        removedAt: null,
      },
      create: {
        assessmentId,
        userId: user.id,
        name: user.name,
        email,
        status: "INVITED",
        inviteToken,
        inviteTokenHash: hashToken(inviteToken),
        inviteExpiresAt: inviteExpiry,
        lastSentAt: new Date(),
      },
    });

    const preview = buildPreview({
      email,
      assessmentName: assessment.name,
      unitCode: assessment.unitCode,
      username,
      temporaryPassword,
    });

    previews.push(preview);

    await prisma.emailLog.create({
      data: {
        to: email,
        subject: preview.subject,
        template: preview.kind,
        status: "SENT",
        sentAt: new Date(),
      },
    });
  }

  return { emailsProcessed: previews.length, previews, skipped };
}
