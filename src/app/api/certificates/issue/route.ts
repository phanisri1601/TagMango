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
  const certId = new URL(req.url).searchParams.get("certId") || "";
  const rows = (await store.find("certIssues", [["userId", me.id], ["certId", certId]])).sort((a, b) => String(b.issuedAt).localeCompare(String(a.issuedAt)));
  return NextResponse.json({ rows: rows.map((r) => ({ id: r.id, name: r.name, email: r.email, code: r.code, issuedAt: r.issuedAt })) });
}
