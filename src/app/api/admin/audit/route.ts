import { NextResponse } from "next/server";
import { snapshot } from "@/lib/db";
import { deny, requireAdmin } from "@/lib/admin";
import { rowsOf } from "@/lib/adminData";
import type { AAudit } from "@/lib/adminTypes";

export async function GET() {
  if (!(await requireAdmin())) return deny();
  const db = await snapshot();
  const entries: AAudit[] = rowsOf(db, "audit")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 1000)
    .map((a) => ({ id: a.id, createdAt: a.createdAt, admin: String(a.admin), action: String(a.action), target: String(a.target), detail: String(a.detail || "") }));
  return NextResponse.json({ entries });
}
