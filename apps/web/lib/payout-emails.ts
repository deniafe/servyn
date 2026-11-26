import "server-only";
import { createLogger } from "@servyn/observability";

const log = createLogger({ service: "web", module: "payout-emails" });

export interface PayoutEmailPayload {
  to: string;
  subject: string;
  text: string;
}

export async function sendPayoutNotificationEmail(
  payload: PayoutEmailPayload,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Servyn <notifications@servyn.net>";

  if (!apiKey) {
    log.info("payout email logged (RESEND_API_KEY not configured)", {
      to: payload.to,
      subject: payload.subject,
    });
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [payload.to],
        subject: payload.subject,
        text: payload.text,
      }),
    });

    if (!res.ok) {
      log.warn("resend email request failed", {
        status: res.status,
        subject: payload.subject,
      });
      return false;
    }

    log.info("payout email sent", { subject: payload.subject });
    return true;
  } catch (err) {
    log.warn("payout email error", {
      subject: payload.subject,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

export function buildFirstConfirmationEmail(input: {
  recipientName: string;
  confirmedByName: string;
  title: string;
  refId: string;
  amountLabel: string;
}): { subject: string; text: string } {
  return {
    subject: `Action needed: ${input.confirmedByName} confirmed ${input.title} (${input.refId})`,
    text: [
      `Hi ${input.recipientName},`,
      "",
      `${input.confirmedByName} has confirmed completion for "${input.title}" (${input.refId}).`,
      "",
      `If you also confirm, the protected payment (${input.amountLabel}) is released to the vendor straight away.`,
      `Otherwise, it will automatically release in 48 hours unless you report an issue in your Servyn chat.`,
      "",
      `— SERVYN LTD`,
    ].join("\n"),
  };
}

export function build24hReminderEmail(input: {
  recipientName: string;
  title: string;
  refId: string;
  amountLabel: string;
}): { subject: string; text: string } {
  return {
    subject: `Reminder: 24 hours left before payout for ${input.title} (${input.refId})`,
    text: [
      `Hi ${input.recipientName},`,
      "",
      `This is your 24-hour reminder for "${input.title}" (${input.refId}).`,
      `The protected payment (${input.amountLabel}) will automatically release in 24 hours unless you confirm earlier or report an issue in Servyn chat.`,
      "",
      `— SERVYN LTD`,
    ].join("\n"),
  };
}
