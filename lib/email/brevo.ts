type TransactionalEmail = {
  to: string;
  recipientName?: string | null;
  subject: string;
  textContent: string;
  htmlContent: string;
};

type BrevoSendResult =
  | { sent: true; messageId: string }
  | { sent: false; error: string };

export function isBrevoConfigured() {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

export async function sendBrevoEmail(message: TransactionalEmail): Promise<BrevoSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    return { sent: false, error: "Brevo is not configured." };
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: {
          email: senderEmail,
          name: process.env.BREVO_SENDER_NAME || "PRISM",
        },
        to: [
          {
            email: message.to,
            ...(message.recipientName ? { name: message.recipientName } : {}),
          },
        ],
        subject: message.subject,
        textContent: message.textContent,
        htmlContent: message.htmlContent,
        ...(process.env.BREVO_REPLY_TO_EMAIL
          ? { replyTo: { email: process.env.BREVO_REPLY_TO_EMAIL } }
          : {}),
        tags: ["educator-invite"],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      messageId?: string;
      message?: string;
      code?: string;
    };

    if (!response.ok || !payload.messageId) {
      const detail = payload.message || payload.code || `HTTP ${response.status}`;
      return { sent: false, error: `Brevo rejected the email: ${detail}` };
    }

    return { sent: true, messageId: payload.messageId };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown network error";
    return { sent: false, error: `Could not contact Brevo: ${detail}` };
  }
}
