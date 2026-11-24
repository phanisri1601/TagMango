import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { store } from "@/lib/db";
import { impersonation, RETURN_COOKIE, SESSION_COOKIE, startSession } from "@/lib/auth";
import { deny, isAdminEmail, logAudit, requireAdmin } from "@/lib/admin";

type Ctx = { params: Promise<{ id: string }> };

/**
 * "View as this creator", for support. The admin's own session is parked in a second cookie, the creator's
 * view lasts 2 hours, and every start is written to the audit log. Money, bank, KYC and password actions stay off.
 */
export async function POST(_req: Request, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return deny();
  if (await impersonation()) return NextResponse.json({ error: "Return to admin first" }, { status: 400 });
  const { id } = await params;
  const target = await store.get("users", id);
  if (!target) return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  if (isAdminEmail(String(target.email))) return NextResponse.json({ error: "You can't view as another admin" }, { status: 400 });
  if (target.suspended) return NextResponse.json({ error: "This account is suspended. Reinstate it first." }, { status: 400 });

  const jar = await cookies();
  const mine = jar.get(SESSION_COOKIE)?.value;
  if (!mine) return NextResponse.json({ error: "Please sign in again" }, { status: 401 });
  jar.set(RETURN_COOKIE, mine, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 2 * 3600 });
  await startSession(id, { hours: 2, impersonatedBy: admin.id });
  await store.tx(async (t) => { logAudit(t, admin, "view-as", String(target.email), "Opened the creator's account to help with support (2 hour limit)"); });
  return NextResponse.json({ ok: true, next: target.accountType === "learner" ? "/learn" : "/web/dashboard/getstarted" });
}
