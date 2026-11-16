import { NextResponse } from "next/server";
import { snapshot, tx } from "@/lib/db";
import { currentToken, currentUser, sessionId } from "@/lib/auth";

/** List the signed-in creator's login sessions (Manage Login Sessions page). */
export async function GET() {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const token = await currentToken();
  const db = await snapshot();
  const sessions = db.sessions
    .filter((s) => s.userId === me.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((s) => ({ id: sessionId(s.token), userAgent: s.userAgent || "Unknown device", ip: s.ip || "-", createdAt: s.createdAt, current: s.token === token }));
  return NextResponse.json({ sessions });
}

/** Log out one session (?id=) or every other session (?others=1). */
export async function DELETE(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const token = await currentToken();
  const url = new URL(req.url);
  const target = url.searchParams.get("id");
  const others = url.searchParams.get("others") === "1";
  const removed = await tx((db) => {
    const before = db.sessions.length;
    db.sessions = db.sessions.filter((s) => {
      if (s.userId !== me.id) return true;
      if (others) return s.token === token;
      return sessionId(s.token) !== target || s.token === token;
    });
    return before - db.sessions.length;
  });
  return NextResponse.json({ ok: true, removed });
}
