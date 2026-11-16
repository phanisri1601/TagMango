import { NextResponse } from "next/server";
import { tx } from "@/lib/db";
import { deny, logAudit, requireAdmin } from "@/lib/admin";

/** Delete an announcement and pull it out of every creator's notification list. */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return deny();
  const { id } = await params;
  try {
    await tx((db) => {
      const a = (db.rows.announcements || []).find((x) => x.id === id);
      if (!a) throw new Error("Announcement not found");
      db.rows.announcements = db.rows.announcements.filter((x) => x.id !== id);
      db.rows.notifications = (db.rows.notifications || []).filter((n) => n.announcementId !== id);
      logAudit(db, admin, "announcement.delete", String(a.title), "retracted from all notification lists");
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
