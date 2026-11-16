import { NextResponse } from "next/server";
import { COLLECTIONS, id, now, snapshot, tx, type Collection } from "@/lib/db";
import { currentUser } from "@/lib/auth";

const valid = (c: string): c is Collection => (COLLECTIONS as readonly string[]).includes(c);

export async function GET(_req: Request, { params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (!valid(collection)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const db = await snapshot();
  const rows = (db.rows[collection] || []).filter((r) => r.userId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json({ rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ collection: string }> }) {
  const { collection } = await params;
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (!valid(collection)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _i, userId: _u, createdAt: _c, ...data } = body;
  const row = await tx((db) => {
    const r = { ...data, id: id(), userId: me.id, createdAt: now() };
    (db.rows[collection] ||= []).push(r);
    return r;
  });
  return NextResponse.json({ row }, { status: 201 });
}
