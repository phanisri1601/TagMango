import { NextResponse } from "next/server";
import { currentUser, hashPassword, passwordProblem, verifyPassword } from "@/lib/auth";
import { store } from "@/lib/db";

/** Set or change the password of the signed-in user. Changing an existing password needs the current one. */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Please sign in" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const bad = passwordProblem(String(body.password || ""), String(body.confirm ?? ""));
  if (bad) return NextResponse.json({ error: bad }, { status: 400 });
  if (me.passwordHash && !(await verifyPassword(String(body.current || ""), me.passwordHash))) return NextResponse.json({ error: "Your current password is not correct" }, { status: 400 });
  await store.write([{ type: "update", coll: "users", id: me.id, patch: { passwordHash: await hashPassword(String(body.password)) } }]);
  return NextResponse.json({ ok: true, hadPassword: Boolean(me.passwordHash) });
}
