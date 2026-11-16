import { NextResponse } from "next/server";
import { id, now, tx } from "@/lib/db";

/** A buyer entered their details at checkout but hasn't paid yet → Leads › Drop-Offs. Cleared on purchase. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ ok: false });
  await tx((db) => {
    const mango = (db.rows.mangoes || []).find((m) => m.id === body.mangoId);
    if (!mango) return;
    const leads = (db.rows.leads ||= []);
    const existing = leads.find((l) => l.type === "dropoff" && l.userId === mango.userId && l.email === email && l.mango === mango.title);
    if (existing) existing.createdAt = now();
    else leads.push({ id: id(), userId: mango.userId, createdAt: now(), type: "dropoff", name: String(body.name || "").trim() || email, email, phone: "", mango: mango.title, pageTitle: "Checkout" });
  });
  return NextResponse.json({ ok: true });
}
