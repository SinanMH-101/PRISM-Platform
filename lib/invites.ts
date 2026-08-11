import { createHash, randomBytes } from "crypto";
import { prisma } from "./prisma";
import { hashPassword } from "./password";
import { isBrevoConfigured, sendBrevoEmail } from "./email/brevo";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type InviteEmailPreview = {
  to: string;
  subject: string;
  kind: "existing-user-invite" | "new-user-credentials";
  username: string;
  temporaryPassword?: string;
  body: string;
  htmlBody: string;
};

export type InviteEducatorsResult = {
  emailsProcessed: number;
  previews: InviteEmailPreview[];
  skipped: string[];
  sent: number;
  failed: { email: string; error: string }[];
  deliveryMode: "brevo" | "preview";
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildHtmlEmail({
  assessmentName,
  unitCode,
  username,
  temporaryPassword,
  loginUrl,
}: {
  assessmentName: string;
  unitCode: string;
  username: string;
  temporaryPassword?: string;
  loginUrl: string;
}) {
  const safeAssessmentName = escapeHtml(assessmentName);
  const safeUnitCode = escapeHtml(unitCode);
  const safeUsername = escapeHtml(username);
  const safePassword = temporaryPassword ? escapeHtml(temporaryPassword) : null;
  const safeLoginUrl = escapeHtml(loginUrl);
  const introduction = temporaryPassword
    ? "A TA account has been created for you. Use the temporary credentials below to get started."
    : "You have been invited to join this assessment as a TA. Sign in with your existing PRISM account to get started.";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>PRISM TA invitation</title>
  </head>
  <body style="margin:0;padding:0;background:#FFFFFF;color:#373A36;font-family:Arial,'Helvetica Neue',sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">You have been invited to ${safeUnitCode} ${safeAssessmentName} in PRISM.</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#FFFFFF;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 8px 28px rgba(55,58,54,0.12);">
            <tr>
              <td style="height:8px;background:#A6192E;font-size:0;line-height:0;">&nbsp;</td>
            </tr>
            <tr>
              <td align="center" style="padding:28px 36px 24px;background:#76232F;color:#FFFFFF;text-align:center;">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:#EDEBE5;">Macquarie University</p>
                <h1 style="margin:0;font-size:30px;line-height:1.2;font-weight:700;">Welcome to PRISM</h1>
                <p style="margin:10px 0 0;font-size:16px;line-height:1.5;color:#FFFFFF;">TA assessment invitation</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 36px;">
                <p style="margin:0 0 18px;font-size:16px;line-height:1.65;">Hello,</p>
                <p style="margin:0 0 24px;font-size:16px;line-height:1.65;">${introduction}</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;border:1px solid #D6D2C4;border-radius:8px;background:#FAF9F7;">
                  <tr>
                    <td style="padding:20px 22px;">
                      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#76232F;">Assessment</p>
                      <p style="margin:0;font-size:18px;line-height:1.45;font-weight:700;color:#373A36;">${safeUnitCode}: ${safeAssessmentName}</p>
                    </td>
                  </tr>
                </table>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 26px;border-left:4px solid #A6192E;background:#F7F3F3;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0 0 6px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#76232F;">Username</p>
                      <p style="margin:0;font-size:16px;line-height:1.5;font-weight:700;color:#373A36;word-break:break-all;">${safeUsername}</p>
                      ${safePassword ? `<p style="margin:18px 0 6px;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#76232F;">Temporary password</p><p style="margin:0;font-size:16px;line-height:1.5;font-family:Consolas,'Courier New',monospace;font-weight:700;color:#373A36;word-break:break-all;">${safePassword}</p>` : ""}
                    </td>
                  </tr>
                </table>
                <table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto 26px;">
                  <tr>
                    <td style="border-radius:6px;background:#A6192E;">
                      <a href="${safeLoginUrl}" style="display:inline-block;padding:14px 24px;font-size:16px;font-weight:700;line-height:1;color:#FFFFFF;text-decoration:none;border-radius:6px;">Sign in to PRISM</a>
                    </td>
                  </tr>
                </table>
                ${safePassword ? `<p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#5D5F5B;">For security, you will be asked to create a new password after signing in.</p>` : ""}
                <p style="margin:0;font-size:13px;line-height:1.6;color:#6B6D69;">If the button does not work, copy and paste this address into your browser:<br><a href="${safeLoginUrl}" style="color:#A6192E;word-break:break-all;">${safeLoginUrl}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 36px;background:#373A36;color:#FFFFFF;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#EDEBE5;">This automated invitation was sent by PRISM for Macquarie University assessment activity.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
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
  const loginUrl = `${(process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "")}/login`;
  const htmlBody = buildHtmlEmail({ assessmentName, unitCode, username, temporaryPassword, loginUrl });

  if (temporaryPassword) {
    return {
      to: email,
      subject,
      kind: "new-user-credentials",
      username,
      temporaryPassword,
      body: [
        `A TA account has been created for ${unitCode} ${assessmentName}.`,
        "",
        `Username: ${username}`,
        `Temporary password: ${temporaryPassword}`,
        "",
        `Sign in at ${loginUrl}. You will be asked to change this password after login.`,
      ].join("\n"),
      htmlBody,
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
      `Sign in at ${loginUrl} with your existing account: ${username}`,
    ].join("\n"),
    htmlBody,
  };
}

export async function inviteEducatorsToAssessment(assessmentId: string, emails: string[]): Promise<InviteEducatorsResult> {
  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, deletedAt: null },
    select: { id: true, name: true, unitCode: true },
  });

  if (!assessment) {
    return { emailsProcessed: 0, previews: [], skipped: emails, sent: 0, failed: [], deliveryMode: isBrevoConfigured() ? "brevo" : "preview" };
  }

  const previews: InviteEmailPreview[] = [];
  const skipped: string[] = [];
  const failed: { email: string; error: string }[] = [];
  const deliveryMode = isBrevoConfigured() ? "brevo" : "preview";
  let sent = 0;

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

    if (deliveryMode === "preview") continue;

    const emailLog = await prisma.emailLog.create({
      data: {
        to: email,
        subject: preview.subject,
        template: preview.kind,
        status: "QUEUED",
      },
    });

    const delivery = await sendBrevoEmail({
      to: email,
      recipientName: user.name,
      subject: preview.subject,
      textContent: preview.body,
      htmlContent: preview.htmlBody,
    });

    if (delivery.sent) {
      const sentAt = new Date();
      sent += 1;
      await prisma.$transaction([
        prisma.emailLog.update({ where: { id: emailLog.id }, data: { status: "SENT", sentAt } }),
        prisma.assessmentEducator.update({
          where: { assessmentId_email: { assessmentId, email } },
          data: { lastSentAt: sentAt },
        }),
      ]);
    } else {
      failed.push({ email, error: delivery.error });
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: { status: "FAILED", error: delivery.error },
      });
    }
  }

  return { emailsProcessed: previews.length, previews, skipped, sent, failed, deliveryMode };
}
