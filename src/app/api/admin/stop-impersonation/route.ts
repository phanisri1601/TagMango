import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { sha, store } from "@/lib/db";
import { currentToken, impersonation, RETURN_COOKIE, SESSION_COOKIE } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin";

/** Ends "view as creator" and puts the admin's own session back. */
export async function POST() {
  const jar = await cookies();
  const back = jar.get(RETURN_COOKIE)?.value;
  const token = await currentToken();
  if (!back || !token || !(await impersonation())) return NextResponse.json({ error: "You are not viewing as a creator" }, { status: 400 });
  const s = await store.get("sessions", sha(back));
  const u = s ? await store.get("users", String(s.userId)) : null;
  if (!u || !isAdminEmail(String(u.email))) return NextResponse.json({ error: "Your admin session has ended. Please sign in again." }, { status: 401 });
  await store.write([{ type: "delete", coll: "sessions", id: sha(token) }]);
  jar.set(SESSION_COOKIE, back, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 8 * 3600 });
  jar.delete(RETURN_COOKIE);
  return NextResponse.json({ ok: true });
}
