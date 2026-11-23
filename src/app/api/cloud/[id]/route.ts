import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { fileStorage } from "@/lib/store/files";
import { activeCustomers } from "@/lib/customers";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Who may open an uploaded file:
 * - the owner, always;
 * - anyone, for images (covers, thumbnails shown on public pages) and for chapters marked "free preview";
 * - a logged-in buyer or enrolled learner of the owner, for videos, audio and documents that the owner has
 *   put into one of their courses, lessons or classes. Other private files (invoices, drafts) stay owner-only.
 */
async function mayView(id: string, row: Record<string, unknown>, me: { id: string; email: string } | null) {
  if (row.kind === "Image") return true;
  if (me && me.id === row.userId) return true;
  const owner = String(row.userId);
  const needle = `/api/cloud/${id}`;
  const courses = await store.find("courses", [["userId", owner]]);
  for (const c of courses) {
    for (const s of ((c.sections as { chapters?: { url?: string; free?: boolean }[] }[]) || [])) {
      for (const ch of s.chapters || []) if (ch.url?.includes(needle) && ch.free) return true;
    }
  }
  if (!me) return false;
  const used =
    courses.some((c) => JSON.stringify(c.sections || []).includes(needle)) ||
    (await store.find("lessons", [["userId", owner]])).some((l) => String(l.videoUrl || "").includes(needle) || String(l.fileUrl || "").includes(needle)) ||
    (await store.find("classes", [["userId", owner]])).some((l) => String(l.recordingUrl || "").includes(needle));
  if (!used) return false;
  const email = me.email.toLowerCase();
  if ((await activeCustomers(owner)).some((c) => c.email === email)) return true;
  return (await store.find("enrolments", [["userId", owner], ["email", email]], { limit: 1 })).length > 0;
}

/** Stream an uploaded file, with Range support so videos can seek. */
export async function GET(req: Request, { params }: Ctx) {
  const { id } = await params;
  const me = await currentUser();
  const row = await store.get("cloud", id);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await mayView(id, row, me))) return NextResponse.json({ error: me ? "Not found" : "Not logged in" }, { status: me ? 404 : 401 });
  const buf = await fileStorage().get(String(row.userId), id);
  if (!buf) return NextResponse.json({ error: "File missing" }, { status: 404 });
  const headers: Record<string, string> = {
    "content-type": String(row.mime || "application/octet-stream"),
    "content-disposition": `inline; filename="${encodeURIComponent(String(row.title))}"`,
    "x-content-type-options": "nosniff",
    "accept-ranges": "bytes",
    "cache-control": "private, max-age=300",
  };
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") || "");
  if (m && (m[1] || m[2])) {
    const size = buf.length;
    const start = m[1] ? Math.min(Number(m[1]), size - 1) : Math.max(0, size - Number(m[2]));
    const end = m[1] && m[2] ? Math.min(Number(m[2]), size - 1) : size - 1;
    return new NextResponse(new Uint8Array(buf.subarray(start, end + 1)), { status: 206, headers: { ...headers, "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(end - start + 1) } });
  }
  return new NextResponse(new Uint8Array(buf), { headers: { ...headers, "content-length": String(buf.length) } });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const row = await store.get("cloud", id);
  if (!row || row.userId !== me.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await store.write([{ type: "delete", coll: "cloud", id }]);
  await fileStorage().remove(me.id, id);
  return NextResponse.json({ ok: true });
}
