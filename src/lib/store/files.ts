import { promises as fs } from "fs";
import crypto from "crypto";
import path from "path";
import { dataDir } from "./file";
import { storageBucket } from "./firebase";
import { storeKind } from "./index";

/** Binary uploads (TagMango Cloud). Firebase Storage when Firestore is the database, local disk otherwise. */
export type FileStorage = {
  put(userId: string, id: string, data: Buffer, mime: string): Promise<void>;
  get(userId: string, id: string): Promise<Buffer | null>;
  remove(userId: string, id: string): Promise<void>;
  removeAllFor(userId: string): Promise<void>;
};

const safe = (s: string) => /^[\w-]+$/.test(s);
const objectPath = (userId: string, id: string) => `uploads/${userId}/${id}`;

const local: FileStorage = {
  async put(userId, id, data) {
    if (!safe(userId) || !safe(id)) throw new Error("Bad file id");
    const dir = path.join(dataDir(), "uploads", userId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, id), data);
  },
  async get(userId, id) {
    if (!safe(userId) || !safe(id)) return null;
    // older versions stored files flat as uploads/<id>
    for (const p of [path.join(dataDir(), "uploads", userId, id), path.join(dataDir(), "uploads", id)]) {
      const b = await fs.readFile(p).catch(() => null);
      if (b) return b;
    }
    return null;
  },
  async remove(userId, id) {
    if (!safe(userId) || !safe(id)) return;
    await fs.unlink(path.join(dataDir(), "uploads", userId, id)).catch(() => {});
    await fs.unlink(path.join(dataDir(), "uploads", id)).catch(() => {});
  },
  async removeAllFor(userId) {
    if (safe(userId)) await fs.rm(path.join(dataDir(), "uploads", userId), { recursive: true, force: true });
  },
};

const firebase: FileStorage = {
  async put(userId, id, data, mime) {
    await storageBucket().file(objectPath(userId, id)).save(data, { contentType: mime || "application/octet-stream", resumable: false });
  },
  async get(userId, id) {
    const f = storageBucket().file(objectPath(userId, id));
    const [exists] = await f.exists();
    return exists ? (await f.download())[0] : null;
  },
  async remove(userId, id) {
    await storageBucket().file(objectPath(userId, id)).delete({ ignoreNotFound: true });
  },
  async removeAllFor(userId) {
    await storageBucket().deleteFiles({ prefix: `uploads/${userId}/` });
  },
};

/* ---- Cloudinary (free plan, no credit card). Files are uploaded as private "authenticated" raw assets and only streamed back through the app. ---- */
function cloudinaryCfg() {
  let name = process.env.CLOUDINARY_CLOUD_NAME, key = process.env.CLOUDINARY_API_KEY, secret = process.env.CLOUDINARY_API_SECRET;
  const url = process.env.CLOUDINARY_URL; // cloudinary://<key>:<secret>@<cloud>
  if ((!name || !key || !secret) && url) {
    const m = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url.trim());
    if (m) [, key, secret, name] = m;
  }
  return name && key && secret ? { name, key, secret } : null;
}
export const cloudinaryConfigured = () => cloudinaryCfg() !== null;

const sign = (params: Record<string, string>, secret: string) =>
  crypto.createHash("sha1").update(Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&") + secret).digest("hex");

const cloudinary: FileStorage = {
  async put(userId, id, data, mime) {
    const c = cloudinaryCfg()!;
    const p = { public_id: objectPath(userId, id), timestamp: String(Math.floor(Date.now() / 1000)), type: "authenticated" };
    const form = new FormData();
    for (const [k, v] of Object.entries(p)) form.set(k, v);
    form.set("api_key", c.key);
    form.set("signature", sign(p, c.secret));
    form.set("file", new Blob([new Uint8Array(data)], { type: mime }), id);
    const r = await fetch(`https://api.cloudinary.com/v1_1/${c.name}/raw/upload`, { method: "POST", body: form });
    if (!r.ok) throw new Error(`Cloudinary ${r.status}: ${(await r.text()).slice(0, 200)}`);
  },
  async get(userId, id) {
    const c = cloudinaryCfg()!;
    const p = { public_id: objectPath(userId, id), timestamp: String(Math.floor(Date.now() / 1000)), type: "authenticated" };
    const q = new URLSearchParams({ ...p, api_key: c.key, signature: sign(p, c.secret) });
    const r = await fetch(`https://api.cloudinary.com/v1_1/${c.name}/raw/download?${q}`);
    return r.ok ? Buffer.from(await r.arrayBuffer()) : null;
  },
  async remove(userId, id) {
    const c = cloudinaryCfg()!;
    const p = { public_id: objectPath(userId, id), timestamp: String(Math.floor(Date.now() / 1000)), type: "authenticated" };
    await fetch(`https://api.cloudinary.com/v1_1/${c.name}/raw/destroy`, { method: "POST", body: new URLSearchParams({ ...p, api_key: c.key, signature: sign(p, c.secret) }) }).catch(() => {});
  },
  async removeAllFor(userId) {
    const c = cloudinaryCfg()!;
    await fetch(`https://api.cloudinary.com/v1_1/${c.name}/resources/raw/authenticated?prefix=${encodeURIComponent(`uploads/${userId}/`)}`, {
      method: "DELETE",
      headers: { authorization: "Basic " + Buffer.from(`${c.key}:${c.secret}`).toString("base64") },
    }).catch(() => {});
  },
};

/* ---- Cloudinary direct upload and signed delivery ----
 * Large files must not pass through the app server (serverless hosts cap request and response bodies at about 4.5 MB).
 * The browser uploads straight to Cloudinary with a one-off signature; playback is a redirect to a signed URL
 * that the app only hands out after its own permission check (see /api/cloud/[id]). Images, video and audio use this path.
 * Other documents stay on the server path above. */
export type CldType = "image" | "video" | "raw";
export const cldTypeOf = (mime: string): CldType => (mime.startsWith("image/") ? "image" : mime.startsWith("video/") || mime.startsWith("audio/") ? "video" : "raw");

const sha1 = (s: string) => crypto.createHash("sha1").update(s).digest();

/** Parameters the browser needs to upload one file straight to Cloudinary. Null when Cloudinary is not configured. */
export function cldSignUpload(userId: string, id: string, mime: string) {
  const c = cloudinaryCfg();
  if (!c || !safe(userId) || !safe(id)) return null;
  const rtype = cldTypeOf(mime);
  const p = { public_id: objectPath(userId, id), timestamp: String(Math.floor(Date.now() / 1000)), type: "authenticated" };
  return { url: `https://api.cloudinary.com/v1_1/${c.name}/${rtype}/upload`, rtype, fields: { ...p, api_key: c.key, signature: sign(p, c.secret) } };
}

/** Ask Cloudinary what it really stored (size, format), so the browser's word is never trusted. */
export async function cldInfo(rtype: CldType, userId: string, id: string): Promise<{ bytes: number; format?: string } | null> {
  const c = cloudinaryCfg();
  if (!c || !safe(userId) || !safe(id)) return null;
  const r = await fetch(`https://api.cloudinary.com/v1_1/${c.name}/resources/${rtype}/authenticated/${objectPath(userId, id).split("/").map(encodeURIComponent).join("/")}`, {
    headers: { authorization: "Basic " + Buffer.from(`${c.key}:${c.secret}`).toString("base64") },
  });
  if (!r.ok) return null;
  const j = (await r.json()) as { bytes?: number; format?: string };
  return { bytes: Number(j.bytes || 0), format: j.format };
}

/** Signed delivery URL for an authenticated image or video. */
export function cldDeliveryUrl(rtype: "image" | "video", userId: string, id: string, format: string) {
  const c = cloudinaryCfg()!;
  const pid = `${objectPath(userId, id)}.${format}`;
  const s = "s--" + Buffer.from(sha1(pid + c.secret)).toString("base64url").slice(0, 8) + "--";
  return `https://res.cloudinary.com/${c.name}/${rtype}/authenticated/${s}/${pid}`;
}

export async function cldRemove(rtype: CldType, userId: string, id: string) {
  const c = cloudinaryCfg();
  if (!c) return;
  const p = { public_id: objectPath(userId, id), timestamp: String(Math.floor(Date.now() / 1000)), type: "authenticated" };
  await fetch(`https://api.cloudinary.com/v1_1/${c.name}/${rtype}/destroy`, { method: "POST", body: new URLSearchParams({ ...p, api_key: c.key, signature: sign(p, c.secret) }) }).catch(() => {});
}

export const fileStorage = (): FileStorage => (cloudinaryConfigured() ? cloudinary : storeKind() === "firestore" ? firebase : local);
