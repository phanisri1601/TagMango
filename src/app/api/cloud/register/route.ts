import { NextResponse } from "next/server";
import { now, store } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { cldInfo, cldTypeOf, cldRemove } from "@/lib/store/files";

/** Step 2 of a browser upload: confirm with Cloudinary that the file arrived, then list it on the Cloud page. */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const fid = String(b.id || "");
  const mime = String(b.mime || "application/octet-stream").slice(0, 100);
  if (!/^[\w-]{6,40}$/.test(fid)) return NextResponse.json({ error: "Bad file id" }, { status: 400 });
  if (await store.get("cloud", fid)) return NextResponse.json({ error: "Already registered" }, { status: 409 });
  const rtype = cldTypeOf(mime);
  const info = await cldInfo(rtype, me.id, fid);
  if (!info) return NextResponse.json({ error: "The upload did not complete. Please try again." }, { status: 400 });
  const kind = mime.startsWith("video") ? "Video" : mime.startsWith("image") ? "Image" : mime.startsWith("audio") ? "Audio" : mime === "application/pdf" ? "PDF" : "Other";
  const row = { userId: me.id, createdAt: now(), title: String(b.name || "file").slice(0, 200), size: info.bytes, mime, kind, rtype, format: info.format || "", ...(b.private ? { private: true } : {}) };
  try {
    await store.write([{ type: "set", coll: "cloud", id: fid, data: row }]);
  } catch (e) {
    await cldRemove(rtype, me.id, fid);
    throw e;
  }
  return NextResponse.json({ row: { id: fid, ...row }, url: `/api/cloud/${fid}` }, { status: 201 });
}
