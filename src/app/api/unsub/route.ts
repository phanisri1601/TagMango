import { NextResponse } from "next/server";
import { id, now, store } from "@/lib/db";
import { unsubOk } from "@/lib/unsub";

/** One-click unsubscribe from the link at the bottom of every automated email. */
export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));
  const creator = String(b.c || ""), email = String(b.e || "").trim().toLowerCase(), t = String(b.t || "");
  if (!creator || !email || !unsubOk(creator, email, t)) return NextResponse.json({ error: "This link is not valid" }, { status: 400 });
  const have = await store.find("unsubscribed", [["userId", creator], ["email", email]], { limit: 1 });
  if (!have.length) await store.write([{ type: "set", coll: "unsubscribed", id: id(), data: { userId: creator, createdAt: now(), email, source: "email link" } }]);
  return NextResponse.json({ ok: true });
}
