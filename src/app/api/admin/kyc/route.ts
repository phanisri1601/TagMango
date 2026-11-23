import { NextResponse } from "next/server";
import { asUser, id as newId, now, store, type Kyc, type User } from "@/lib/db";
import { deny, logAudit, notify, requireAdmin } from "@/lib/admin";
import { caseView, withEvent } from "@/lib/kyc";

const bad = (m: string, status = 400) => NextResponse.json({ error: m }, { status });

/** Super admin: the KYC queue, one case in full, and the reviewer list. */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return deny();
  const q = new URL(req.url).searchParams;
  const reviewers = (await store.find("kycReviewers")).map((r) => ({ id: r.id, email: r.email, name: r.name }));
  const users = (await store.find("users")).map(asUser).filter((u) => u.kyc && !u.role);
  if (q.get("user")) {
    const u = users.find((x) => x.id === q.get("user"));
    return u ? NextResponse.json({ case: caseView(u), reviewers }) : bad("Case not found", 404);
  }
  const rows = users.map((u) => { const k = u.kyc!; return { userId: u.id, name: u.name, email: u.email, legalName: k.legalName, status: k.status, submittedAt: k.submittedAt, reviewerEmail: k.reviewerEmail, reviewerName: k.reviewerName, recommendation: k.recommendation, reviewedAt: k.reviewedAt, finalAt: k.finalAt, finalBy: k.finalBy }; })
    .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
  return NextResponse.json({ rows, reviewers });
}

/** Super admin: add or remove reviewers, assign a case (step 2), make the final decision (step 5). */
export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return deny();
  const b = await req.json().catch(() => ({}));
  const action = String(b.action || "");

  if (action === "reviewer-add") {
    const email = String(b.email || "").trim().toLowerCase();
    const name = String(b.name || "").trim().slice(0, 80);
    if (!/^\S+@\S+\.\S+$/.test(email)) return bad("Enter the reviewer's email address");
    if (!name) return bad("Enter the reviewer's name");
    if ((await store.find("kycReviewers", [["email", email]], { limit: 1 })).length) return bad("That reviewer is already added");
    const rid = newId();
    await store.tx(async (t) => { t.set("kycReviewers", rid, { userId: admin.id, createdAt: now(), email, name }); logAudit(t, admin, "KYC reviewer added", email); });
    return NextResponse.json({ ok: true, id: rid });
  }
  if (action === "reviewer-remove") {
    const r = await store.get("kycReviewers", String(b.id || ""));
    if (!r) return bad("Reviewer not found", 404);
    const open = (await store.find("users")).map(asUser).filter((u) => u.kyc?.reviewerEmail === r.email && u.kyc?.status === "assigned");
    if (open.length) return bad(`${open.length} case(s) are still assigned to ${String(r.name)}. Reassign them first.`);
    await store.tx(async (t) => { t.delete("kycReviewers", r.id); logAudit(t, admin, "KYC reviewer removed", String(r.email)); });
    return NextResponse.json({ ok: true });
  }

  const userId = String(b.userId || "");
  try {
    await store.tx(async (t) => {
      const u = asUser(await t.get("users", userId)) as User | undefined;
      if (!u?.kyc) throw new Error("Case not found");
      const k: Kyc = u.kyc;

      if (action === "assign") {
        // Step 2: the super admin picks a reviewer; the reviewer's id is recorded on the case.
        if (!["pending", "assigned"].includes(k.status)) throw new Error("This case can't be assigned right now");
        const r = await t.get("kycReviewers", String(b.reviewerId || ""));
        if (!r) throw new Error("Choose a reviewer");
        const kyc: Kyc = { ...k, status: "assigned", reviewerId: r.id, reviewerEmail: String(r.email), reviewerName: String(r.name), assignedAt: now(), assignedBy: admin.email, recommendation: undefined, reviewedAt: undefined, reviewedBy: undefined, reviewerRemarks: undefined,
          history: withEvent(k, { by: admin.email, role: "admin", action: `Assigned to ${String(r.name)}` }) };
        t.update("users", u.id, { kyc });
        logAudit(t, admin, "KYC assigned", u.email, `to ${String(r.email)}`);
        const ru = (await t.find("users", [["email", String(r.email)]], { limit: 1 }))[0];
        if (ru) notify(t, ru.id, `A KYC case for ${u.name} was assigned to you.`, { link: "/reviewer" });
        return;
      }

      if (action === "final") {
        // Step 5: the super admin decides after the reviewer's recommendation is in.
        const decision = String(b.decision || "");
        const note = String(b.note || "").trim().slice(0, 300);
        if (k.status !== "reviewed") throw new Error("The reviewer has not submitted a recommendation yet");
        if (!["approve", "reject", "resubmit"].includes(decision)) throw new Error("Choose approve, reject or request resubmission");
        if (decision !== "approve" && !note) throw new Error("Write the reason; the creator will see it");
        const at = now();
        if (decision === "approve") {
          t.update("users", u.id, { kycDone: true, kyc: { ...k, status: "verified", finalBy: admin.email, finalAt: at, note: undefined, history: withEvent(k, { by: admin.email, role: "admin", action: "Approved", note }) } });
          notify(t, u.id, "Your KYC has been verified. You can now withdraw your earnings.");
        } else if (decision === "reject") {
          t.update("users", u.id, { kycDone: false, kyc: { ...k, status: "rejected", finalBy: admin.email, finalAt: at, note, history: withEvent(k, { by: admin.email, role: "admin", action: "Rejected", note }) } });
          notify(t, u.id, `Your KYC was rejected: ${note}`);
        } else {
          t.update("users", u.id, { kycDone: false, kyc: { ...k, status: "resubmit", finalBy: admin.email, finalAt: at, note, history: withEvent(k, { by: admin.email, role: "admin", action: "Asked to resubmit", note }) } });
          notify(t, u.id, `Please resubmit your KYC: ${note}`);
        }
        logAudit(t, admin, `KYC ${decision}`, u.email, note);
        return;
      }
      throw new Error("Unknown action");
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return bad((e as Error).message);
  }
}
