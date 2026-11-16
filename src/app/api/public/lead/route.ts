import { NextResponse } from "next/server";
import { id, now, tx } from "@/lib/db";

/** Lead form submission from a public Mango Page → Customers › Leads › Form Responses. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter your name and a valid email" }, { status: 400 });
  const ok = await tx((db) => {
    const page = (db.rows.pages || []).find((p) => p.slug === body.slug && p.published);
    if (!page) return false;
    (db.rows.leads ||= []).push({ id: id(), userId: page.userId, createdAt: now(), type: "form", name, email, phone, mango: page.mango, pageTitle: page.title });
    return true;
  });
  if (!ok) return NextResponse.json({ error: "Page not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
