import { NextResponse } from "next/server";
import { id, now, PLANS, tx, type Plan } from "@/lib/db";
import { currentUser } from "@/lib/auth";

const PLAN_PRICE: Record<Plan, number> = { basic: 0, pro: 5000, advanced: 15000, ultimate: 35000 };

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  return NextResponse.json({ user: { plan: "basic", ...user } });
}

/** Update profile fields: name, about, kycDone, bank, settings (merged), plan (test-mode upgrade), whiteLabel. */
export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const user = await tx((db) => {
      const u = db.users.find((x) => x.id === me.id)!;
      if (typeof body.name === "string" && body.name.trim()) u.name = body.name.trim();
      if (body.about && typeof body.about === "object") u.about = { ...u.about, ...body.about };
      if (typeof body.kycDone === "boolean") u.kycDone = body.kycDone;
      if (body.settings && typeof body.settings === "object" && !Array.isArray(body.settings)) {
        u.settings = { ...u.settings, ...body.settings };
      }
      if (body.bank && typeof body.bank === "object") {
        const { holder, account, ifsc } = body.bank;
        if (!holder || !/^\d{9,18}$/.test(String(account)) || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(String(ifsc))) {
          throw new Error("Enter a valid account number (9–18 digits) and IFSC (e.g. HDFC0001234)");
        }
        u.bank = { holder: String(holder), account: String(account), ifsc: String(ifsc).toUpperCase() };
      }
      if (body.plan !== undefined) {
        if (!(PLANS as readonly string[]).includes(body.plan)) throw new Error("Unknown plan");
        const plan = body.plan as Plan;
        if (plan !== (u.plan || "basic")) {
          u.plan = plan;
          // Test-mode billing: record an invoice for the change.
          (db.rows.invoices ||= []).push({
            id: id(),
            userId: u.id,
            createdAt: now(),
            number: `TM-${Date.now().toString().slice(-8)}`,
            product: `${plan[0].toUpperCase() + plan.slice(1)} plan`,
            amount: Math.round(PLAN_PRICE[plan] * 1.18),
            status: "Paid (test)",
          });
        }
      }
      if (body.whiteLabel === true && !u.whiteLabel) {
        u.whiteLabel = true;
        (db.rows.invoices ||= []).push({ id: id(), userId: u.id, createdAt: now(), number: `TM-${Date.now().toString().slice(-8)}`, product: "Freedom Setup", amount: Math.round(24999 * 1.18), status: "Paid (test)" });
      }
      return { plan: "basic", ...u };
    });
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
