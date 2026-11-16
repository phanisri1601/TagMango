import { NextResponse } from "next/server";
import { tx } from "@/lib/db";
import { deny, logAudit, notify, requireAdmin } from "@/lib/admin";

/** Resolve a report: dismiss it, or remove the reported post/comment. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return deny();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.action !== "dismiss" && body.action !== "remove") return NextResponse.json({ error: "Action must be dismiss or remove" }, { status: 400 });
  try {
    await tx((db) => {
      const r = (db.rows.reports || []).find((x) => x.id === id);
      if (!r) throw new Error("Report not found");
      if (r.resolved) throw new Error("This report was already resolved");
      if (body.action === "remove" && r.refId) {
        const coll = r.kind === "comment" ? "comments" : "posts";
        db.rows[coll] = (db.rows[coll] || []).filter((x) => !(x.id === r.refId && x.userId === r.userId));
        notify(db, r.userId, `TagMango removed a ${String(r.kind)} from your community after a report.`);
      }
      r.resolved = body.action === "remove" ? "removed" : "dismissed";
      logAudit(db, admin, `report.${r.resolved}`, `${String(r.kind)} by ${String(r.author)}`, String(r.content).slice(0, 80));
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
