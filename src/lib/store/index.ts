import { createFileStore } from "./file";
import { createFirestoreStore } from "./firestore";
import { fieldValue, firebaseConfigured, firestore } from "./firebase";
import type { Store } from "./types";

export * from "./types";

/** STORE_DRIVER=firestore | file | auto (default). Auto uses Firestore when Firebase credentials are present. */
export function storeKind(): "file" | "firestore" {
  const want = (process.env.STORE_DRIVER || "auto").toLowerCase();
  if (want === "file" || want === "firestore") return want;
  if (firebaseConfigured()) return "firestore";
  if (process.env.NODE_ENV === "production") {
    throw new Error("Firebase isn't configured. Set the FIREBASE_* variables (see .env.example), or STORE_DRIVER=file to knowingly use local files (data is lost on serverless hosts).");
  }
  return "file";
}

const g = globalThis as { __tmStore?: Store };

function getStore(): Store {
  if (!g.__tmStore) g.__tmStore = storeKind() === "firestore" ? createFirestoreStore(firestore(), fieldValue) : createFileStore();
  return g.__tmStore;
}

/** The database. Lazily created so importing this module never touches Firebase or the disk. */
export const store: Store = {
  get kind() {
    return getStore().kind;
  },
  get: (c, id) => getStore().get(c, id),
  find: (c, f, o) => getStore().find(c, f, o),
  count: (c, f) => getStore().count(c, f),
  tx: (fn) => getStore().tx(fn),
  write: (ops) => getStore().write(ops),
  deleteWhere: (c, f) => getStore().deleteWhere(c, f),
};
