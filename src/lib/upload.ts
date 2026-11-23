"use client";

export type Uploaded = { id: string; url: string; name: string; kind: string; size: number };

/** A stored link is either a normal web address or a file from the Cloud page. */
export const isLink = (v: unknown) => /^https?:\/\//.test(String(v || "")) || /^\/api\/cloud\/[\w-]+$/.test(String(v || ""));
export const isCloudLink = (v: unknown) => /^\/api\/cloud\/[\w-]+$/.test(String(v || "")) || /\/api\/cloud\/[\w-]+$/.test(String(v || ""));

function xhr(url: string, form: FormData, onProgress?: (pct: number) => void) {
  return new Promise<{ status: number; body: string }>((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("POST", url);
    x.upload.onprogress = (e) => e.lengthComputable && onProgress?.(Math.round((e.loaded / e.total) * 100));
    x.onload = () => resolve({ status: x.status, body: x.responseText });
    x.onerror = () => reject(new Error("Network error during upload"));
    x.send(form);
  });
}

/**
 * Upload one file. With Cloudinary the browser sends it straight there (no size limit from the app server);
 * otherwise it goes through the app's own upload. Resolves with the link to store in a field: /api/cloud/<id>.
 */
export async function uploadFile(file: File, onProgress?: (pct: number) => void, opts: { private?: boolean } = {}): Promise<Uploaded> {
  const mime = file.type || "application/octet-stream";
  const sign = await fetch("/api/cloud/sign", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: file.name, size: file.size, mime }) }).then((r) => r.json());
  if (sign.error) throw new Error(sign.error);
  if (sign.mode === "direct") {
    const form = new FormData();
    for (const [k, v] of Object.entries(sign.fields as Record<string, string>)) form.set(k, v);
    form.set("file", file);
    const up = await xhr(sign.url, form, onProgress);
    if (up.status < 200 || up.status >= 300) {
      let msg = "Upload failed";
      try { msg = JSON.parse(up.body).error?.message || msg; } catch { /* keep default */ }
      throw new Error(/File size too large|too large/i.test(msg) ? "That file is larger than your Cloudinary plan allows. Paste a Vimeo or YouTube link instead." : msg);
    }
    const reg = await fetch("/api/cloud/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: sign.id, name: file.name, mime, private: !!opts.private }) }).then((r) => r.json());
    if (reg.error) throw new Error(reg.error);
    return { id: reg.row.id, url: reg.url, name: file.name, kind: reg.row.kind, size: reg.row.size };
  }
  const form = new FormData();
  form.set("file", file);
  if (opts.private) form.set("private", "1");
  const up = await xhr("/api/cloud", form, onProgress);
  const j = JSON.parse(up.body || "{}");
  if (up.status >= 300 || j.error) throw new Error(j.error || "Upload failed");
  return { id: j.row.id, url: `/api/cloud/${j.row.id}`, name: file.name, kind: j.row.kind, size: j.row.size };
}
