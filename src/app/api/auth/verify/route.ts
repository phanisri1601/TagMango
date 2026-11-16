import { NextResponse } from "next/server";
import { id, now, snapshot, tx } from "@/lib/db";
import { checkOtp, normEmail, normPhone, startSession } from "@/lib/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const phone = normPhone(body.phone);
  const email = normEmail(body.email);
  const code = String(body.code || "").trim();
  const key = body.mode !== "signup" && email ? `email:${email}` : `phone:${phone}`;

  if (!(await checkOtp(key, code))) {
    return NextResponse.json({ error: "Incorrect or expired OTP" }, { status: 400 });
  }

  if (body.mode === "signup") {
    const userId = await tx((db) => {
      if (db.users.some((u) => u.phone === phone || u.email === email)) return null;
      const uid = id();
      db.users.push({
        id: uid,
        name: String(body.name || "").trim(),
        email,
        phone,
        marketingOptIn: Boolean(body.marketing),
        createdAt: now(),
      });
      return uid;
    });
    if (!userId) return NextResponse.json({ error: "Account already exists. Please login." }, { status: 409 });
    await startSession(userId);
    return NextResponse.json({ ok: true, next: "/web/sign-up/about" });
  }

  const db = await snapshot();
  const user = email ? db.users.find((u) => u.email === email) : db.users.find((u) => u.phone === phone);
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  await startSession(user.id);
  return NextResponse.json({ ok: true, next: "/web/dashboard/getstarted" });
}
