import { NextResponse } from "next/server";
import { COLLECTIONS, tx, type Collection } from "@/lib/db";
import { currentUser } from "@/lib/auth";

type Ctx = { params: Promise<{ collection: string; id: string }> };
const valid = (c: string): c is Collection => (COLLECTIONS as readonly string[]).includes(c);

export async function PATCH(req: Request, { params }: Ctx) {
  const { collection, id } = await params;
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (!valid(collection)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const body = await req.json().catch(() => ({}));
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _i, userId: _u, createdAt: _c, ...data } = body || {};
  const row = await tx((db) => {
    const r = (db.rows[collection] || []).find((x) => x.id === id && x.userId === me.id);
    if (r) Object.assign(r, data, { updatedAt: new Date().toISOString() });
    return r || null;
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ row });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { collection, id } = await params;
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (!valid(collection)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const ok = await tx((db) => {
    const list = db.rows[collection] || [];
    const before = list.length;
    db.rows[collection] = list.filter((x) => !(x.id === id && x.userId === me.id));
    return db.rows[collection].length < before;
  });
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
