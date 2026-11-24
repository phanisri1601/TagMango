import { NextResponse } from "next/server";
import { landingFor, findUserByEmail, findUserByPhone, MAX_PW_FAILS, normEmail, normPhone, PW_LOCK_MS, startSession, verifyPassword } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";
import { store } from "@/lib/db";

const BAD = "Incorrect email, phone or password. If you have not set a password yet, sign in with a one-time code.";

/** Sign in with email or phone plus password. Five wrong attempts lock the account for 15 minutes. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = normEmail(body.email);
  const phone = normPhone(body.phone);
  const password = String(body.password || "");
  if ((!email && phone.length !== 10) || !password) return NextResponse.json({ error: "Enter your email or phone, and your password" }, { status: 400 });
  if (body.admin && !isAdminEmail(email)) return NextResponse.json({ error: "This email is not allowed to sign in to the admin panel." }, { status: 403 });

  const user = email ? await findUserByEmail(email) : await findUserByPhone(phone);
  if (!user) return NextResponse.json({ error: BAD }, { status: 401 });
  if (user.pwLockUntil && user.pwLockUntil > Date.now()) return NextResponse.json({ error: `Too many wrong attempts. Try again in ${Math.ceil((user.pwLockUntil - Date.now()) / 60000)} minutes, or sign in with a one-time code.` }, { status: 429 });

  if (!(await verifyPassword(password, user.passwordHash))) {
    const fails = (user.pwFails || 0) + 1;
    await store.write([{ type: "update", coll: "users", id: user.id, patch: fails >= MAX_PW_FAILS ? { pwFails: 0, pwLockUntil: Date.now() + PW_LOCK_MS } : { pwFails: fails } }]);
    return NextResponse.json({ error: BAD }, { status: 401 });
  }
  if (user.suspended) return NextResponse.json({ error: "This account has been suspended. Please contact support." }, { status: 403 });
  if (user.pwFails || user.pwLockUntil) await store.write([{ type: "update", coll: "users", id: user.id, patch: { pwFails: 0, pwLockUntil: 0 } }]);
  await startSession(user.id, body.admin ? { hours: 8 } : undefined);
  return NextResponse.json({ ok: true, next: landingFor(user, Boolean(body.admin), isAdminEmail(user.email)) });
}
