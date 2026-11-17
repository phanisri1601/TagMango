import { NextResponse } from "next/server";
import { id, now, store } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { fileStorage } from "@/lib/store/files";

const MAX_FILE = 50 * 1024 * 1024; // 50 MB per file
const QUOTA = 20 * 1024 * 1024 * 1024; // 20 GB (Basic plan)

/** Upload a file to "TagMango Cloud" (Firebase Storage, or local disk in development). */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file to upload" }, { status: 400 });
  if (file.size > MAX_FILE) return NextResponse.json({ error: "Files up to 50 MB can be uploaded" }, { status: 400 });

  const used = (await store.find("cloud", [["userId", me.id]])).reduce((a, r) => a + Number(r.size || 0), 0);
  if (used + file.size > QUOTA) return NextResponse.json({ error: "Storage quota exceeded" }, { status: 400 });

  if (store.kind === "firestore" && !process.env.FIREBASE_STORAGE_BUCKET) {
    return NextResponse.json({ error: "File uploads aren't enabled yet: add a Firebase Storage bucket (FIREBASE_STORAGE_BUCKET)." }, { status: 503 });
  }
  const fid = id();
  const mime = file.type || "application/octet-stream";
  try {
    await fileStorage().put(me.id, fid, Buffer.from(await file.arrayBuffer()), mime);
  } catch {
    return NextResponse.json({ error: "File storage isn't available. Check that Firebase Storage is set up and FIREBASE_STORAGE_BUCKET is correct." }, { status: 503 });
  }
  const kind = mime.startsWith("video") ? "Video" : mime.startsWith("image") ? "Image" : mime.startsWith("audio") ? "Audio" : mime === "application/pdf" ? "PDF" : "Other";
  const row = { userId: me.id, createdAt: now(), title: file.name.slice(0, 200), size: file.size, mime, kind };
  try {
    await store.write([{ type: "set", coll: "cloud", id: fid, data: row }]);
  } catch (e) {
    await fileStorage().remove(me.id, fid);
    throw e;
  }
  return NextResponse.json({ row: { id: fid, ...row } }, { status: 201 });
}
