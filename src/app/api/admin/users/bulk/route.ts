import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { deny, isAdminEmail, logAudit, notify, requireAdmin } from "@/lib/admin";

/** Do one thing to many creators at once: suspend, reinstate, or send them a message. Admins are always skipped. */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return deny();
  const b = await req.json().catch(() => ({}));
  const ids = Array.isArray(b.ids) ? [...new Set((b.ids as unknown[]).map(String))].slice(0, 200) : [];
  const action = String(b.action || "");
  const reason = String(b.reason || "").trim().slice(0, 200);
  const message = String(b.message || "").trim().slice(0, 500);
  if (!ids.length) return NextResponse.json({ error: "Select at least one creator" }, { status: 400 });
  if (!["suspend", "unsuspend", "notify"].includes(action)) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  if (action === "suspend" && !reason) return NextResponse.json({ error: "Enter a reason for the suspension" }, { status: 400 });
  if (action === "notify" && !message) return NextResponse.json({ error: "Write the message first" }, { status: 400 });

  let done = 0, skipped = 0;
  for (const id of ids) {
    await store.tx(async (t) => {
      const u = await t.get("users", id);
      if (!u || isAdminEmail(String(u.email)) || u.id === admin.id) { skipped++; return; }
      if (action === "suspend") {
        if (u.suspended) { skipped++; return; }
        t.update("users", id, { suspended: true, suspendReason: reason });
        for (const s of await t.find("sessions", [["userId", id]])) t.delete("sessions", s.id);
        logAudit(t, admin, "suspend", String(u.email), `Bulk: ${reason}`);
      } else if (action === "unsuspend") {
        if (!u.suspended) { skipped++; return; }
        t.update("users", id, { suspended: false, suspendReason: null });
        notify(t, id, "Your account has been reinstated.");
        logAudit(t, admin, "reinstate", String(u.email), "Bulk");
      } else {
        notify(t, id, message);
        logAudit(t, admin, "message", String(u.email), `Bulk: ${message.slice(0, 80)}`);
      }
      done++;
    });
  }
  return NextResponse.json({ ok: true, done, skipped });
}
