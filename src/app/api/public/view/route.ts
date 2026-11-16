import { NextResponse } from "next/server";
import { id, now, tx } from "@/lib/db";

/** Record a page view on a public creator page (feeds Analytics → Checkout Page / Page Views). */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const kind = ["checkout", "page", "store", "site"].includes(body.kind) ? body.kind : null;
  if (!kind || typeof body.ref !== "string") return NextResponse.json({ ok: false }, { status: 400 });
  await tx((db) => {
    const coll = kind === "checkout" ? "mangoes" : kind === "page" ? "pages" : kind === "site" ? "sites" : null;
    const owner = coll ? (db.rows[coll] || []).find((r) => r.id === body.ref || r.slug === body.ref)?.userId : db.users.find((u) => u.id === body.ref)?.id;
    if (!owner) return;
    const target = coll ? (db.rows[coll] || []).find((r) => r.id === body.ref || r.slug === body.ref) : null;
    (db.rows.views ||= []).push({ id: id(), userId: owner, createdAt: now(), kind, ref: target?.id || body.ref, mango: kind === "checkout" ? target?.title : target?.mango });
  });
  return NextResponse.json({ ok: true });
}
