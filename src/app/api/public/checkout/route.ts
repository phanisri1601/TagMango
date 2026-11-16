import { NextResponse } from "next/server";
import { id, now, tx, type Row } from "@/lib/db";

const CYCLE: Record<string, { label: string; days: number }> = {
  "One-time": { label: "One-time", days: 0 },
  Subscription: { label: "Monthly", days: 30 },
  "Monthly subscription": { label: "Monthly", days: 30 },
  "Yearly subscription": { label: "Yearly", days: 365 },
  Free: { label: "Free", days: 0 },
};

/**
 * TEST-MODE checkout: there is no payment gateway, so "paying" records a
 * successful order for the creator. Plug Razorpay/Stripe in here for real payments.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
  const code = String(body.coupon || "").trim().toUpperCase();
  const preview = Boolean(body.preview);
  if (!preview && (!name || !/^\S+@\S+\.\S+$/.test(email))) {
    return NextResponse.json({ error: "Enter your name and a valid email" }, { status: 400 });
  }

  try {
    const out = await tx((db) => {
      const mango = (db.rows.mangoes || []).find((m) => m.id === body.mangoId && m.active);
      if (!mango || db.users.find((u) => u.id === mango.userId)?.suspended) throw new Error("This offering is no longer available");
      const type = String(mango.type || "One-time");
      const base = type === "Free" ? 0 : Number(mango.discountPrice || mango.price || 0);
      let price = base;
      let applied: string | undefined;

      if (code) {
        if (type.includes("ubscription")) throw new Error("Coupons can't be used on subscription mangoes");
        const c = (db.rows.coupons || []).find((x) => x.userId === mango.userId && String(x.code).toUpperCase() === code && x.active);
        if (!c) throw new Error("Invalid coupon code");
        const used = (db.rows.sales || []).filter((s) => s.userId === mango.userId && s.coupon === code && s.status === "Success").length;
        if (c.mango && c.mango !== "All mangoes" && c.mango !== mango.title) throw new Error("This coupon isn't valid for this offering");
        if (c.start && new Date(String(c.start)).getTime() > Date.now()) throw new Error("This coupon isn't active yet");
        if (c.end && new Date(String(c.end)).getTime() < Date.now()) throw new Error("This coupon has expired");
        if (c.maxUses && used >= Number(c.maxUses)) throw new Error("This coupon has reached its usage limit");
        if (c.targetEmails && !String(c.targetEmails).toLowerCase().split(/[\s,]+/).includes(email)) throw new Error("This coupon isn't available for your account");
        price = Math.max(0, Math.round(base * (1 - Number(c.discount || 0) / 100)));
        applied = code;
      }
      if (preview) return { price, coupon: applied };

      const blocked = (db.rows.blocked || []).some((b) => b.userId === mango.userId && b.email === email);
      if (blocked) throw new Error("You can't purchase from this creator");

      const SUB: Record<string, number> = { Monthly: 30, Quarterly: 91, "Half-yearly": 182, Yearly: 365 };
      const cycle = type === "Subscription" ? { label: String(mango.cycle || "Monthly"), days: SUB[String(mango.cycle || "Monthly")] || 30 } : CYCLE[type] || CYCLE["One-time"];
      const expires = cycle.days ? new Date(Date.now() + cycle.days * 864e5).toISOString() : null;
      const sale: Row = {
        id: id(), userId: mango.userId, createdAt: now(), customer: name, email, phone, mango: mango.title, mangoId: mango.id,
        amount: price, quantity: 1, cycle: cycle.label, method: "Test checkout", status: "Success", coupon: applied, expires,
        ref: typeof body.ref === "string" ? body.ref.toUpperCase().slice(0, 40) : undefined,
      };
      (db.rows.sales ||= []).push(sale);
      // purchase clears any drop-off for this buyer + mango
      db.rows.leads = (db.rows.leads || []).filter((l) => !(l.type === "dropoff" && l.userId === mango.userId && l.email === email && l.mango === mango.title));
      (db.rows.notifications ||= []).push({ id: id(), userId: mango.userId, createdAt: now(), read: false, text: `New sale: ${name} bought ${mango.title} for ₹${price.toLocaleString("en-IN")}` });
      return { price, coupon: applied, saleId: sale.id };
    });
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
