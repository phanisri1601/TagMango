import "server-only";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Tiny JSON-file database for local development.
 * Swap this module for a real database (Postgres, Mongo, etc.) before deploying —
 * serverless hosts don't keep files between requests.
 */

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
  about?: { category?: string; audience?: string; goal?: string };
  kycDone?: boolean;
  bank?: { holder: string; account: string; ifsc: string };
  plan?: Plan;
  whiteLabel?: boolean;
  settings?: Record<string, unknown>;
  createdAt: string;
};

export const PLANS = ["basic", "pro", "advanced", "ultimate"] as const;
export type Plan = (typeof PLANS)[number];

export type Row = { id: string; userId: string; createdAt: string; [k: string]: unknown };

type Schema = {
  users: User[];
  sessions: { token: string; userId: string; createdAt: string; userAgent?: string; ip?: string; lastSeen?: string }[];
  otps: { key: string; code: string; expires: number }[];
  rows: Record<string, Row[]>;
};

const FILE = path.join(process.cwd(), "data", "db.json");
const EMPTY: Schema = { users: [], sessions: [], otps: [], rows: {} };

// Collections the dashboard is allowed to read/write through the generic API.
export const COLLECTIONS = [
  "mangoes",
  "courses",
  "workshops",
  "events",
  "bookings",
  "sales",
  "withdrawals",
  "pages",
  "sites",
  "leads",
  "broadcasts",
  "banners",
  "coupons",
  "unsubscribed",
  "paths",
  "emailTemplates",
  "waTemplates",
  "waEvents",
  "certificates",
  "affiliates",
  "pointRules",
  "badges",
  "members",
  "team",
  "cloud",
  "invoices",
  "reports",
  "blocked",
  "customers",
  "files",
  "automations",
  "posts",
  "comments",
  "messages",
  "notifications",
  "views",
] as const;
export type Collection = (typeof COLLECTIONS)[number];

let queue: Promise<unknown> = Promise.resolve();

async function read(): Promise<Schema> {
  try {
    return { ...EMPTY, ...JSON.parse(await fs.readFile(FILE, "utf8")) };
  } catch {
    return structuredClone(EMPTY);
  }
}

async function write(db: Schema) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
}

/** Serialise read-modify-write cycles so concurrent requests don't clobber each other. */
export function tx<T>(fn: (db: Schema) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await read();
    const out = await fn(db);
    await write(db);
    return out;
  });
  queue = run.catch(() => undefined);
  return run;
}

export async function snapshot(): Promise<Schema> {
  await queue;
  return read();
}

export const id = () => crypto.randomBytes(9).toString("base64url");
export const now = () => new Date().toISOString();
