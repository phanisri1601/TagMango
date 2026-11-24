import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { activeCustomers } from "@/lib/customers";
import { certName, emailCertificate, issueCertificate } from "@/lib/certificates";

/** Issue a certificate template to everyone it is meant for. Names come from each customer's own record. */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const cert = await store.get("certificates", String(b.certId || ""));
  if (!cert || cert.userId !== me.id) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  if (b.approve) {
    // Approve learners who finished and are waiting. Their record is the source, so no purchase record is needed.
    const wanted = Array.isArray(b.emails) ? (b.emails as string[]).map((e) => String(e).toLowerCase()) : [];
    const waiting = (await store.find("enrolments", [["userId", me.id]])).filter((e) => e.certWaitingSince && wanted.includes(String(e.email).toLowerCase()));
    let approved = 0;
    for (const e of waiting) {
      const email = String(e.email).toLowerCase();
      const printed = await certName(email, String(e.name));
      const r = await issueCertificate(me.id, cert, { name: printed, email, course: String(cert.forRef || "") });
      if (r.fresh) { approved++; await emailCertificate(me.id, email, printed, String(cert.title), r.code, String(cert.forRef || "")); }
      await store.write([{ type: "update", coll: "enrolments", id: e.id, patch: { certWaitingSince: null } }]);
    }
    return NextResponse.json({ ok: true, approved });
  }
  const only = Array.isArray(b.emails) ? (b.emails as string[]).map((e) => String(e).toLowerCase()) : null;
  const people = (await activeCustomers(me.id, cert.mango ? [String(cert.mango)] : [])).filter((c) => !only || only.includes(c.email));
  let issued = 0, skipped = 0;
  for (const c of people) {
    const printed = await certName(c.email, c.name);
    const r = await issueCertificate(me.id, cert, { name: printed, email: c.email });
    if (r.fresh) { issued++; await emailCertificate(me.id, c.email, printed, String(cert.title), r.code, String(cert.forRef || "")); } else skipped++;
  }
  const sent = Array.from(new Set([...(((cert.sentTo as string[]) || [])), ...people.map((c) => c.email)]));
  await store.write([{ type: "update", coll: "certificates", id: String(cert.id), patch: { sentTo: sent, lastSent: new Date().toISOString() } }]);
  return NextResponse.json({ ok: true, issued, skipped });
}

/** List what has been issued from one template (for the "Issued" view). */
export async function GET(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const sp = new URL(req.url).searchParams;
  if (sp.get("waiting")) {
    // Learners who completed and are waiting for this coach's approval.
    const rows = (await store.find("enrolments", [["userId", me.id]])).filter((e) => e.certWaitingSince);
    return NextResponse.json({ rows: await Promise.all(rows.sort((a, b) => String(a.certWaitingSince).localeCompare(String(b.certWaitingSince))).map(async (e) => ({ id: e.id, email: String(e.email), name: await certName(String(e.email), String(e.name)), since: String(e.certWaitingSince) }))) });
  }
  const certId = sp.get("certId") || "";
  const rows = (await store.find("certIssues", [["userId", me.id], ["certId", certId]])).sort((a, b) => String(b.issuedAt).localeCompare(String(a.issuedAt)));
  return NextResponse.json({ rows: rows.map((r) => ({ id: r.id, name: r.name, email: r.email, code: r.code, issuedAt: r.issuedAt })) });
}
