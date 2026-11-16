import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { id, now, snapshot, tx } from "@/lib/db";
import { currentUser } from "@/lib/auth";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
const MAX_FILE = 50 * 1024 * 1024; // 50 MB per file
const QUOTA = 20 * 1024 * 1024 * 1024; // 20 GB (Basic plan)

/** Upload a file to "TagMango Cloud" (stored under data/uploads). */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload" }, { status: 400 });
  if (file.size > MAX_FILE) return NextResponse.json({ error: "Files up to 50 MB can be uploaded in this clone" }, { status: 400 });

  const db = await snapshot();
  const used = (db.rows.cloud || []).filter((r) => r.userId === me.id).reduce((a, r) => a + Number(r.size || 0), 0);
  if (used + file.size > QUOTA) return NextResponse.json({ error: "Storage quota exceeded" }, { status: 400 });

  const fid = id();
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, fid), Buffer.from(await file.arrayBuffer()));
  const kind = file.type.startsWith("video") ? "Video" : file.type.startsWith("image") ? "Image" : file.type.startsWith("audio") ? "Audio" : file.type === "application/pdf" ? "PDF" : "Other";
  const row = await tx((d) => {
    const r = { id: fid, userId: me.id, createdAt: now(), title: file.name.slice(0, 200), size: file.size, mime: file.type || "application/octet-stream", kind };
    (d.rows.cloud ||= []).push(r);
    return r;
  });
  return NextResponse.json({ row }, { status: 201 });
}
