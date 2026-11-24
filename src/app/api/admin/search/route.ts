import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { deny, requireAdmin } from "@/lib/admin";

type R = Record<string, unknown> & { id: string; userId: string };

/** One search box for the whole admin panel: creators, orders, leads and learners, by name, email or phone. */
export async function GET(req: Request) {
  if (!(await requireAdmin())) return deny();
  const q = (new URL(req.url).searchParams.get("q") || "").trim().toLowerCase();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const all = async (c: string) => (await store.find(c, [])) as unknown as R[];
  const [users, sales, crm, enrols] = await Promise.all([all("users"), all("sales"), all("crm"), all("enrolments")]);
  const has = (...v: unknown[]) => v.some((x) => String(x || "").toLowerCase().includes(q));
  const name = new Map(users.map((u) => [u.id, String(u.name)]));
  const enc = encodeURIComponent(q);
  const results = [
    ...users.filter((u) => has(u.name, u.email, u.phone)).slice(0, 6).map((u) => ({ type: "Creator", label: String(u.name), sub: `${u.email} · ${u.phone}`, href: `/admin/creators?open=${u.id}` })),
    ...sales.filter((s) => has(s.customer, s.email, s.mango, s.id)).slice(0, 5).map((s) => ({ type: "Order", label: `${s.customer} bought ${s.mango}`, sub: `${s.email} · ₹${Number(s.amount || 0).toLocaleString("en-IN")} · ${s.status}`, href: `/admin/orders?q=${encodeURIComponent(String(s.email))}` })),
    ...crm.filter((l) => has(l.name, l.email, l.phone)).slice(0, 5).map((l) => ({ type: "Lead", label: String(l.name), sub: `${l.email} · coach ${name.get(l.userId) || ""}`, href: `/admin/leads?q=${encodeURIComponent(String(l.email))}` })),
    ...enrols.filter((e) => has(e.name, e.email, e.phone)).slice(0, 4).map((e) => ({ type: "Learner", label: String(e.name), sub: `${e.email} · coach ${name.get(e.userId) || ""}`, href: `/admin/learners?q=${encodeURIComponent(String(e.email))}` })),
  ];
  void enc;
  return NextResponse.json({ results });
}
