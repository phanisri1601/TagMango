import { promises as fs } from "fs";
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

export const fileStorage = (): FileStorage => (storeKind() === "firestore" ? firebase : local);
