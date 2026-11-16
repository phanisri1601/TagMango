import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { id as newId, now, PLANS, snapshot, tx, type Plan } from "@/lib/db";
import { deny, isAdminEmail, logAudit, notify, requireAdmin } from "@/lib/admin";
import { invoiceView, orderView, publicUser, rowsOf, statsByUser, withdrawalView } from "@/lib/adminData";
import type { ACreatorDetail } from "@/lib/adminTypes";

type Ctx = { params: Promise<{ id: string }> };
const desc = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);

export async function GET(_req: Request, { params }: Ctx) {
  if (!(await requireAdmin())) return deny();
  const { id } = await params;
  const db = await snapshot();
  const u = db.users.find((x) => x.id === id);
  if (!u) return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  const out: ACreatorDetail = {
    user: { ...publicUser(db, u, statsByUser(db)), bank: u.bank },
    orders: rowsOf(db, "sales").filter((s) => s.userId === id).sort(desc).slice(0, 8).map((s) => orderView(db, s)),
    withdrawals: rowsOf(db, "withdrawals").filter((w) => w.userId === id).sort(desc).slice(0, 8).map((w) => withdrawalView(db, w)),
    mangoes: rowsOf(db, "mangoes").filter((m) => m.userId === id).map((m) => ({ id: m.id, title: String(m.title), price: Number(m.price || 0), type: String(m.type || ""), active: Boolean(m.active) })),
    invoices: rowsOf(db, "invoices").filter((i) => i.userId === id).sort(desc).slice(0, 8).map((i) => invoiceView(db, i)),
    sessions: db.sessions.filter((s) => s.userId === id).length,
    courses: rowsOf(db, "courses").filter((c) => c.userId === id).length,
    workshops: rowsOf(db, "workshops").filter((w) => w.userId === id).length,
  };
  return NextResponse.json(out);
}

/** Admin edits: plan, suspended(+reason), kycDone, whiteLabel, adminNote, notify (send a message). */
export async function PATCH(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return deny();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  try {
    await tx((db) => {
      const u = db.users.find((x) => x.id === id);
      if (!u) throw new Error("Creator not found");
      const changes: string[] = [];

      if (body.plan !== undefined) {
        if (!(PLANS as readonly string[]).includes(body.plan)) throw new Error("Unknown plan");
        const plan = body.plan as Plan;
        if (plan !== (u.plan || "basic")) {
          changes.push(`plan ${u.plan || "basic"} → ${plan}`);
          u.plan = plan;
          // Plan changes made by an admin are recorded as a ₹0 "granted" invoice so they never count as revenue.
          (db.rows.invoices ||= []).push({ id: newId(), userId: u.id, createdAt: now(), number: `TM-${Date.now().toString().slice(-8)}`, product: `${plan[0].toUpperCase() + plan.slice(1)} plan`, amount: 0, status: "Granted by admin" });
          notify(db, u.id, `Your plan was changed to ${plan[0].toUpperCase() + plan.slice(1)} by TagMango.`);
        }
      }
      if (typeof body.suspended === "boolean" && body.suspended !== Boolean(u.suspended)) {
        if (isAdminEmail(u.email) || u.id === admin.id) throw new Error("Admin accounts can't be suspended");
        const reason = String(body.reason || "").trim().slice(0, 200);
        if (body.suspended && !reason) throw new Error("Enter a reason for the suspension");
        u.suspended = body.suspended;
        u.suspendReason = body.suspended ? reason : undefined;
        if (body.suspended) db.sessions = db.sessions.filter((s) => s.userId !== u.id); // sign them out everywhere
        else notify(db, u.id, "Your account has been reinstated.");
        changes.push(body.suspended ? `suspended (${reason})` : "reinstated");
      }
      if (typeof body.kycDone === "boolean" && body.kycDone !== Boolean(u.kycDone)) {
        u.kycDone = body.kycDone;
        changes.push(`KYC ${body.kycDone ? "verified" : "revoked"}`);
        notify(db, u.id, body.kycDone ? "Your KYC has been verified." : "Your KYC was revoked. Please resubmit your details under Withdrawals.");
      }
      if (typeof body.whiteLabel === "boolean" && body.whiteLabel !== Boolean(u.whiteLabel)) {
        u.whiteLabel = body.whiteLabel;
        changes.push(`Freedom Setup ${body.whiteLabel ? "granted" : "removed"}`);
      }
      if (typeof body.adminNote === "string" && body.adminNote !== (u.adminNote || "")) {
        u.adminNote = body.adminNote.slice(0, 1000);
        changes.push("internal note updated");
      }
      if (typeof body.notify === "string" && body.notify.trim()) {
        notify(db, u.id, `📩 ${body.notify.trim().slice(0, 500)}`);
        changes.push("message sent");
      }
      if (changes.length) logAudit(db, admin, "creator.update", `${u.name} <${u.email}>`, changes.join("; "));
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}

/** Permanently delete a creator and everything they own. Requires ?confirm=<their email>. */
export async function DELETE(req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return deny();
  const { id } = await params;
  const confirm = (new URL(req.url).searchParams.get("confirm") || "").trim().toLowerCase();
  try {
    const files = await tx((db) => {
      const u = db.users.find((x) => x.id === id);
      if (!u) throw new Error("Creator not found");
      if (isAdminEmail(u.email) || u.id === admin.id) throw new Error("Admin accounts can't be deleted");
      if (confirm !== u.email.toLowerCase()) throw new Error("Type the creator's email to confirm");
      const ids = (db.rows.cloud || []).filter((r) => r.userId === id).map((r) => r.id);
      db.users = db.users.filter((x) => x.id !== id);
      db.sessions = db.sessions.filter((s) => s.userId !== id);
      db.otps = db.otps.filter((o) => o.key !== `phone:${u.phone}` && o.key !== `email:${u.email}`);
      for (const k of Object.keys(db.rows)) if (k !== "audit") db.rows[k] = db.rows[k].filter((r) => r.userId !== id);
      logAudit(db, admin, "creator.delete", `${u.name} <${u.email}>`, "account and all data removed");
      return ids;
    });
    const dir = path.join(process.cwd(), "data", "uploads");
    await Promise.all(files.filter((f) => /^[\w-]+$/.test(f)).map((f) => fs.unlink(path.join(dir, f)).catch(() => {})));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
