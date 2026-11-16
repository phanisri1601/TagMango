import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { snapshot } from "@/lib/db";
import { adminEmails, deny, requireAdmin } from "@/lib/admin";

async function dirSize(dir: string) {
  try {
    const files = await fs.readdir(dir);
    const sizes = await Promise.all(files.map((f) => fs.stat(path.join(dir, f)).then((s) => s.size).catch(() => 0)));
    return { files: files.length, bytes: sizes.reduce((a, b) => a + b, 0) };
  } catch {
    return { files: 0, bytes: 0 };
  }
}

/** Platform info for the admin Settings page. Admin emails come from the ADMIN_EMAILS env var (read-only here). */
export async function GET() {
  const me = await requireAdmin();
  if (!me) return deny();
  const db = await snapshot();
  const dbFile = await fs.stat(path.join(process.cwd(), "data", "db.json")).catch(() => null);
  return NextResponse.json({
    admins: adminEmails(),
    you: me.email,
    env: process.env.NODE_ENV,
    otpOnScreen: process.env.NODE_ENV !== "production" || process.env.SHOW_DEV_OTP === "1",
    users: db.users.length,
    sessions: db.sessions.length,
    dbBytes: dbFile?.size || 0,
    uploads: await dirSize(path.join(process.cwd(), "data", "uploads")),
    collections: Object.entries(db.rows).map(([name, rows]) => ({ name, count: rows.length })).sort((a, b) => b.count - a.count),
  });
}
