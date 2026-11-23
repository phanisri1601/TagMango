import { NextResponse } from "next/server";
import { asUser, now, store, type Kyc } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { caseView, isReviewer, withEvent } from "@/lib/kyc";
import { logAudit, notify } from "@/lib/admin";
import { isAdminUser } from "@/lib/admin";

const bad = (m: string, status = 400) => NextResponse.json({ error: m }, { status });

/** The reviewer's own cases: waiting for their recommendation, and ones they have already sent. */
export async function GET(req: Request) {
  const me = await currentUser();
  if (!me || !(await isReviewer(me))) return bad("Reviewer access required", 403);
  const email = me.email.toLowerCase();
  const mine = (await store.find("users")).map(asUser).filter((u) => u.kyc?.reviewerEmail === email);
  const one = new URL(req.url).searchParams.get("user");
  if (one) {
    const u = mine.find((x) => x.id === one);
    return u ? NextResponse.json({ case: caseView(u) }) : bad("Case not found", 404);
  }
  const row = (u: (typeof mine)[number]) => ({ userId: u.id, name: u.name, email: u.email, legalName: u.kyc!.legalName, status: u.kyc!.status, assignedAt: u.kyc!.assignedAt, reviewedAt: u.kyc!.reviewedAt, recommendation: u.kyc!.recommendation });
  return NextResponse.json({
    me: { name: me.name, email: me.email },
    todo: mine.filter((u) => u.kyc!.status === "assigned").map(row).sort((a, b) => String(a.assignedAt).localeCompare(String(b.assignedAt))),
    done: mine.filter((u) => u.kyc!.status !== "assigned").map(row).sort((a, b) => String(b.reviewedAt).localeCompare(String(a.reviewedAt))).slice(0, 50),
  });
}

/** Steps 3 and 4: the reviewer checks the documents and submits a recommendation with remarks. */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me || !(await isReviewer(me))) return bad("Reviewer access required", 403);
  const b = await req.json().catch(() => ({}));
  const recommendation = b.recommendation === "approve" ? "approve" : b.recommendation === "corrections" ? "corrections" : null;
  const remarks = String(b.remarks || "").trim().slice(0, 600);
  if (!recommendation) return bad("Choose: approve for final review, or request corrections");
  if (remarks.length < 5) return bad("Write your remarks. The super admin reads them before deciding.");
  try {
    await store.tx(async (t) => {
      const u = asUser(await t.get("users", String(b.userId || "")));
      const k = u?.kyc as Kyc | undefined;
      if (!u || !k || k.reviewerEmail !== me.email.toLowerCase()) throw new Error("This case is not assigned to you");
      if (k.status !== "assigned") throw new Error("You have already submitted your recommendation for this case");
      const at = now();
      t.update("users", u.id, { kyc: { ...k, status: "reviewed", recommendation, reviewedBy: me.email, reviewedAt: at, reviewerRemarks: remarks, history: withEvent(k, { by: me.email, role: "reviewer", action: recommendation === "approve" ? "Recommended approval" : "Requested corrections", note: remarks }) } });
      logAudit(t, me, "KYC recommendation", u.email, recommendation);
      const admins = (await t.find("users")).map(asUser).filter((x) => isAdminUser(x));
      for (const a of admins) notify(t, a.id, `KYC review ready for your decision: ${u.name} (${recommendation === "approve" ? "approval recommended" : "corrections requested"}).`, { link: "/admin/kyc" });
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return bad((e as Error).message);
  }
}
