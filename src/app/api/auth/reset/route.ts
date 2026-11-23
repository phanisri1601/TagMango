import { NextResponse } from "next/server";
import { checkOtp, findUserByEmail, hashPassword, normEmail, passwordProblem } from "@/lib/auth";
import { store } from "@/lib/db";

/** Forgot password: the one-time code sent to the email proves ownership, then the new password is saved. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normEmail(body.email);
  const bad = passwordProblem(String(body.password || ""), String(body.confirm ?? ""));
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  if (!(await checkOtp(`email:${email}`, String(body.code || "").trim()))) return NextResponse.json({ error: "Incorrect or expired OTP" }, { status: 400 });
  const user = await findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  await store.write([{ type: "update", coll: "users", id: user.id, patch: { passwordHash: await hashPassword(String(body.password)), pwFails: 0, pwLockUntil: 0 } }]);
  return NextResponse.json({ ok: true });
}
