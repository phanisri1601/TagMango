import "server-only";
import nodemailer from "nodemailer";
import { id, now, store } from "./db";

/**
 * Outbound email (SMTP) and SMS (Twilio). Both are optional:
 *  - Without SMTP, emails are written to the `outbox` collection in development (so you can inspect them)
 *    and skipped in production unless EMAIL_OUTBOX=1.
 *  - Without Twilio, SMS is skipped.
 */
export const emailConfigured = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
export const emailjsConfigured = () => Boolean(process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY && process.env.EMAILJS_PRIVATE_KEY);
export const smsConfigured = () => Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);

const g = globalThis as { __tmMail?: nodemailer.Transporter };
function transport() {
  if (!g.__tmMail) {
    const port = Number(process.env.SMTP_PORT || 587);
    g.__tmMail = nodemailer.createTransport({ host: process.env.SMTP_HOST, port, secure: port === 465, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
  }
  return g.__tmMail;
}

export type SendResult = { ok: boolean; mode: "smtp" | "outbox" | "sms" | "skipped"; error?: string };

export async function sendEmail(m: { to: string; subject: string; text: string; userId?: string; kind?: string; fromName?: string; replyTo?: string }): Promise<SendResult> {
  if (!/^\S+@\S+\.\S+$/.test(m.to)) return { ok: false, mode: "skipped", error: "invalid recipient" };
  if (emailConfigured()) {
    try {
      await transport().sendMail({ from: m.fromName ? `"${m.fromName.replace(/"/g, "")}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>` : process.env.SMTP_FROM || process.env.SMTP_USER, replyTo: m.replyTo, to: m.to, subject: m.subject, text: m.text });
      return { ok: true, mode: "smtp" };
    } catch (e) {
      return { ok: false, mode: "smtp", error: (e as Error).message };
    }
  }
  if (process.env.NODE_ENV !== "production" || process.env.EMAIL_OUTBOX === "1") {
    const oid = id();
    await store.write([{ type: "set", coll: "outbox", id: oid, data: { userId: m.userId || "system", createdAt: now(), to: m.to, subject: m.subject, text: m.text, kind: m.kind || "email" } }]);
    return { ok: true, mode: "outbox" };
  }
  return { ok: false, mode: "skipped", error: "SMTP is not configured" };
}

export async function sendSms(phone10: string, body: string): Promise<SendResult> {
  if (!smsConfigured()) return { ok: false, mode: "skipped", error: "Twilio is not configured" };
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID!;
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: { authorization: "Basic " + Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"), "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ To: `+91${phone10}`, From: process.env.TWILIO_FROM!, Body: body }),
    });
    return r.ok ? { ok: true, mode: "sms" } : { ok: false, mode: "sms", error: `Twilio ${r.status}: ${(await r.text()).slice(0, 160)}` };
  } catch (e) {
    return { ok: false, mode: "sms", error: (e as Error).message };
  }
}

/** Send a login code by SMS (preferred when a phone is given and Twilio is set up) or email. */
export async function deliverOtp(o: { code: string; phone?: string; email?: string; name?: string }) {
  const text = `Your TagMango verification code is ${o.code}. It expires in 5 minutes. Don't share it with anyone.`;
  if (o.phone && smsConfigured()) {
    const r = await sendSms(o.phone, text);
    if (r.ok) return { delivered: true, channel: "sms" as const };
  }
  if (o.email && emailjsConfigured()) {
    try {
      const r = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          service_id: process.env.EMAILJS_SERVICE_ID,
          template_id: process.env.EMAILJS_TEMPLATE_ID,
          user_id: process.env.EMAILJS_PUBLIC_KEY,
          accessToken: process.env.EMAILJS_PRIVATE_KEY,
          template_params: { to_email: o.email, to_name: o.name || "there", otp: o.code, expires_in: "5 minutes", reply_to: process.env.EMAILJS_REPLY_TO || o.email },
        }),
      });
      if (r.ok) return { delivered: true, channel: "email" as const };
    } catch {
      /* fall through to SMTP */
    }
  }
  if (o.email && emailConfigured()) {
    const r = await sendEmail({ to: o.email, subject: "Your TagMango verification code", text, kind: "otp" });
    if (r.ok) return { delivered: true, channel: "email" as const };
  }
  return { delivered: false as const };
}

/** Replace {name}-style variables in an email template. */
export function fill(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}
