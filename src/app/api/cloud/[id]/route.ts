import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { snapshot, tx } from "@/lib/db";
import { currentUser } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
type Ctx = { params: Promise<{ id: string }> };

/** Stream an uploaded file back to its owner. */
export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const db = await snapshot();
  const row = (db.rows.cloud || []).find((r) => r.id === id && r.userId === me.id);
  if (!row || !/^[\w-]+$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const buf = await fs.readFile(path.join(UPLOAD_DIR, id)).catch(() => null);
  if (!buf) return NextResponse.json({ error: "File missing" }, { status: 404 });
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "content-type": String(row.mime || "application/octet-stream"),
      "content-disposition": `inline; filename="${encodeURIComponent(String(row.title))}"`,
    },
  });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const ok = await tx((db) => {
    const before = (db.rows.cloud || []).length;
    db.rows.cloud = (db.rows.cloud || []).filter((r) => !(r.id === id && r.userId === me.id));
    return db.rows.cloud.length < before;
  });
  if (!ok) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (/^[\w-]+$/.test(id)) await fs.unlink(path.join(UPLOAD_DIR, id)).catch(() => {});
  return NextResponse.json({ ok: true });
}
