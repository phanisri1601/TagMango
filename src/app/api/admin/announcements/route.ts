import { NextResponse } from "next/server";
import { id as newId, now, PLANS, snapshot, tx } from "@/lib/db";
import { deny, isAdminEmail, logAudit, notify, requireAdmin } from "@/lib/admin";
import { planOf, rowsOf } from "@/lib/adminData";
import type { AAnnouncement } from "@/lib/adminTypes";

export async function GET() {
  if (!(await requireAdmin())) return deny();
  const db = await snapshot();
  const announcements: AAnnouncement[] = rowsOf(db, "announcements")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((a) => ({ id: a.id, createdAt: a.createdAt, title: String(a.title), body: String(a.body), audience: String(a.audience), recipients: Number(a.recipients || 0), admin: String(a.admin || "") }));
  return NextResponse.json({ announcements });
}

/** Send an announcement to every creator (or one plan). It lands in their notification bell. */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return deny();
  const body = await req.json().catch(() => ({}));
  const title = String(body.title || "").trim();
  const text = String(body.body || "").trim();
  const audience = String(body.audience || "all");
  if (title.length < 3 || title.length > 80) return NextResponse.json({ error: "Title must be 3–80 characters" }, { status: 400 });
  if (text.length < 5 || text.length > 500) return NextResponse.json({ error: "Message must be 5–500 characters" }, { status: 400 });
  if (audience !== "all" && !(PLANS as readonly string[]).includes(audience)) return NextResponse.json({ error: "Unknown audience" }, { status: 400 });
  try {
    const row = await tx((db) => {
      const targets = db.users.filter((u) => !isAdminEmail(u.email) && !u.suspended && (audience === "all" || planOf(u) === audience));
      if (!targets.length) throw new Error("No creators match that audience");
      const a = { id: newId(), userId: admin.id, createdAt: now(), title, body: text, audience, recipients: targets.length, admin: admin.email };
      (db.rows.announcements ||= []).push(a);
      for (const u of targets) notify(db, u.id, `📢 ${title} — ${text}`, { announcementId: a.id });
      logAudit(db, admin, "announcement.send", title, `to ${audience === "all" ? "all creators" : `${audience} plan`} (${targets.length})`);
      return a;
    });
    return NextResponse.json({ ok: true, recipients: row.recipients }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
