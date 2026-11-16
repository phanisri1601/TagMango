import "server-only";
import crypto from "crypto";
import { cookies, headers } from "next/headers";
import { snapshot, tx, type User } from "./db";

export const SESSION_COOKIE = "tm_session";
const OTP_TTL_MS = 5 * 60 * 1000;

export function normPhone(p: string) {
  return (p || "").replace(/\D/g, "").slice(-10);
}
export function normEmail(e: string) {
  return (e || "").trim().toLowerCase();
}

export async function issueOtp(key: string) {
  const code = String(crypto.randomInt(100000, 1000000));
  await tx((db) => {
    db.otps = db.otps.filter((o) => o.key !== key && o.expires > Date.now());
    db.otps.push({ key, code, expires: Date.now() + OTP_TTL_MS });
  });
  return code;
}

export async function checkOtp(key: string, code: string) {
  return tx((db) => {
    const hit = db.otps.find((o) => o.key === key && o.code === code && o.expires > Date.now());
    if (hit) db.otps = db.otps.filter((o) => o !== hit);
    return Boolean(hit);
  });
}

export async function startSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const h = await headers();
  const userAgent = h.get("user-agent") || "Unknown device";
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || "127.0.0.1";
  await tx((db) => {
    const now = new Date().toISOString();
    db.sessions.push({ token, userId, createdAt: now, lastSeen: now, userAgent, ip });
    // Enforce "Manage Login Sessions" device limit: drop the oldest sessions over the limit.
    const user = db.users.find((u) => u.id === userId);
    const limit = Number(user?.settings?.maxDevices || 0);
    if (limit > 0) {
      const mine = db.sessions.filter((s) => s.userId === userId).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      const drop = new Set(mine.slice(0, Math.max(0, mine.length - limit)).map((s) => s.token));
      db.sessions = db.sessions.filter((s) => !drop.has(s.token));
    }
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await tx((db) => void (db.sessions = db.sessions.filter((s) => s.token !== token)));
  jar.delete(SESSION_COOKIE);
}

/** Public, non-secret id for a session (so the UI can list/revoke sessions without exposing tokens). */
export const sessionId = (token: string) => crypto.createHash("sha256").update(token).digest("hex").slice(0, 16);

export async function currentToken() {
  return (await cookies()).get(SESSION_COOKIE)?.value || null;
}

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const db = await snapshot();
  const s = db.sessions.find((x) => x.token === token);
  return (s && db.users.find((u) => u.id === s.userId)) || null;
}

/** OTPs are shown on screen in development because no SMS/email provider is wired up. */
export const SHOW_DEV_OTP = process.env.NODE_ENV !== "production" || process.env.SHOW_DEV_OTP === "1";
