import { NextResponse } from "next/server";
import { snapshot } from "@/lib/db";
import { issueOtp, normEmail, normPhone, SHOW_DEV_OTP } from "@/lib/auth";

/**
 * Request an OTP.
 *  mode "login":  account must exist (by phone or email)
 *  mode "signup": phone and email must NOT be taken yet
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const mode = body.mode === "signup" ? "signup" : "login";
  const phone = normPhone(body.phone);
  const email = normEmail(body.email);
  const db = await snapshot();

  if (mode === "signup") {
    const name = String(body.name || "").trim();
    if (!name) return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
    if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Please enter a valid email" }, { status: 400 });
    if (phone.length !== 10) return NextResponse.json({ error: "Please enter a valid 10-digit phone number" }, { status: 400 });
    if (!body.terms) return NextResponse.json({ error: "Please accept the Terms of Service" }, { status: 400 });
    if (db.users.some((u) => u.phone === phone)) return NextResponse.json({ error: "This phone number is already registered. Please login." }, { status: 409 });
    if (db.users.some((u) => u.email === email)) return NextResponse.json({ error: "This email is already registered. Please login." }, { status: 409 });
    const code = await issueOtp(`phone:${phone}`);
    return NextResponse.json({ ok: true, sentTo: `+91 ${phone}`, ...(SHOW_DEV_OTP && { devOtp: code }) });
  }

  const key = email ? `email:${email}` : `phone:${phone}`;
  const user = email ? db.users.find((u) => u.email === email) : db.users.find((u) => u.phone === phone);
  if (!email && phone.length !== 10) return NextResponse.json({ error: "Please enter a valid 10-digit phone number" }, { status: 400 });
  if (!user) return NextResponse.json({ error: "No account found. Please sign up first." }, { status: 404 });
  if (user.suspended) return NextResponse.json({ error: "This account has been suspended. Please contact support." }, { status: 403 });
  const code = await issueOtp(key);
  return NextResponse.json({ ok: true, sentTo: email || `+91 ${phone}`, ...(SHOW_DEV_OTP && { devOtp: code }) });
}
