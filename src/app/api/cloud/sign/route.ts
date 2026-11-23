import { NextResponse } from "next/server";
import { id, store } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { limitOf } from "@/lib/plans";
import { cldSignUpload, cloudinaryConfigured } from "@/lib/store/files";
import { rateLimited } from "@/lib/ratelimit";

const MAX = { video: 100 * 1024 * 1024, other: 10 * 1024 * 1024 }; // Cloudinary's free-plan per-file limits

/**
 * Step 1 of a browser upload. With Cloudinary configured the browser sends the file straight to Cloudinary
 * (so big videos never pass through this server). Otherwise it is told to use the normal server upload.
 */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  if (await rateLimited("cloudsign", 60)) return NextResponse.json({ error: "Too many uploads. Try again in a minute." }, { status: 429 });
  const b = await req.json().catch(() => ({}));
  const mime = String(b.mime || "application/octet-stream").slice(0, 100);
  const size = Number(b.size || 0);
  if (!cloudinaryConfigured()) return NextResponse.json({ mode: "server" });
  if (size > (mime.startsWith("video/") || mime.startsWith("audio/") ? MAX.video : MAX.other)) return NextResponse.json({ error: `That file is too large. Videos up to 100 MB and other files up to 10 MB can be uploaded; for longer videos paste a Vimeo or YouTube link.` }, { status: 400 });
  const used = (await store.find("cloud", [["userId", me.id]])).reduce((a, r) => a + Number(r.size || 0), 0);
  if (used + size > limitOf(me, "storageGB") * 1024 ** 3) return NextResponse.json({ error: `Your plan includes ${limitOf(me, "storageGB")} GB of storage and it is full. Delete files or upgrade your plan.` }, { status: 400 });
  const fid = id();
  const s = cldSignUpload(me.id, fid, mime)!;
  return NextResponse.json({ mode: "direct", id: fid, url: s.url, fields: s.fields, rtype: s.rtype });
}
