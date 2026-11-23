import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { rateLimited } from "@/lib/ratelimit";

/** Public verification: anyone with a credential id can see who it was issued to. No contact details are returned. */
export async function GET(req: Request) {
  if (await rateLimited("certverify", 40)) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  const code = (new URL(req.url).searchParams.get("code") || "").toUpperCase();
  const [r] = /^NR-[A-Z0-9]{10}$/.test(code) ? await store.find("certIssues", [["code", code]], { limit: 1 }) : [];
  if (!r) return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
  return NextResponse.json({ code: r.code, name: r.name, course: r.course, title: r.title, design: r.design, issuer: r.issuer, signer: r.signer, signerTitle: r.signerTitle, details: r.details, date: r.issuedAt });
}
