import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { rateLimited } from "@/lib/ratelimit";
import { alertCoach, mark, sourceFor, upsertLead } from "@/lib/growth/core";
import { readPerson } from "@/lib/growth/person";
import { siteGrowth } from "@/lib/site/data";

const clip = (v: unknown, n = 1500) => String(v ?? "").trim().slice(0, n);

/** Forms on the public website: free resource (lead magnet), application, contact. All connect to the same lead record and workflows. */
export async function POST(req: Request) {
  if (await rateLimited("site", 12)) return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const g = await siteGrowth();
  if (!g) return NextResponse.json({ error: "This site is not set up yet" }, { status: 503 });
  const kind = String(body.kind || "");
  const p = readPerson(body, { phone: kind === "apply" });
  if ("error" in p) return NextResponse.json({ error: p.error }, { status: 400 });
  const src = await sourceFor(g.userId, String(body.src || ""));

  if (kind === "contact") {
    const message = clip(body.message);
    if (message.length < 5) return NextResponse.json({ error: "Write a short message" }, { status: 400 });
    await alertCoach(g.userId, `Website message from ${p.person.name} (${p.person.email}${p.person.phone ? ", " + p.person.phone : ""}):\n${message}`);
    return NextResponse.json({ ok: true });
  }
  if (!body.consent) return NextResponse.json({ error: "Please tick the box to continue" }, { status: 400 });

  const lead = await upsertLead(g.userId, { ...p.person, source: src, consent: true });
  if (kind === "resource") {
    await mark(g.userId, lead.id, "resource", { detail: "Free resource form" });
    return NextResponse.json({ ok: true, url: g.resourceUrl ? String(g.resourceUrl) : null });
  }
  if (kind === "apply") {
    const a = body.answers || {};
    const application = { pattern: clip(a.pattern), why: clip(a.why), ready: clip(a.ready, 200), at: new Date().toISOString() };
    if (!application.why) return NextResponse.json({ error: "Tell us a little about why you are applying" }, { status: 400 });
    await store.write([{ type: "update", coll: "crm", id: lead.id, patch: { application } }]);
    await mark(g.userId, lead.id, "applied", { detail: application.why.slice(0, 160) });
    await alertCoach(g.userId, `New application from ${lead.name} (${lead.email}). Why now: ${application.why}${application.pattern ? `\nPattern they notice: ${application.pattern}` : ""}\nOpen Growth › Leads to see the card.`);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "Unknown form" }, { status: 400 });
}
