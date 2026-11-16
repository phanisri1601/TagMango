import { NextResponse } from "next/server";
import crypto from "crypto";
import { tx } from "@/lib/db";
import { currentUser } from "@/lib/auth";

/** Generate (or rotate) an API key for Zapier / Pabbly. Stored on the user's settings. */
export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const provider = body.provider === "pabbly" ? "pabbly" : body.provider === "zapier" ? "zapier" : null;
  if (!provider) return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
  const key = `tm_${provider === "zapier" ? "zap" : "pab"}_${crypto.randomBytes(20).toString("hex")}`;
  const user = await tx((db) => {
    const u = db.users.find((x) => x.id === me.id)!;
    u.settings = { ...u.settings, apiKeys: { ...((u.settings?.apiKeys as object) || {}), [provider]: { key, createdAt: new Date().toISOString() } } };
    return { plan: "basic", ...u };
  });
  return NextResponse.json({ user });
}
