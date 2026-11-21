import { NextResponse } from "next/server";
import { asUser, id, now, store } from "@/lib/db";
import { rateLimited } from "@/lib/ratelimit";
import { afterSuccess } from "@/lib/payments";
import { createOrder, razorpayConfigured, razorpayKeyId } from "@/lib/razorpay";

const CYCLE: Record<string, { label: string; days: number }> = {
  "One-time": { label: "One-time", days: 0 },
  Subscription: { label: "Monthly", days: 30 },
  "Monthly subscription": { label: "Monthly", days: 30 },
  "Yearly subscription": { label: "Yearly", days: 365 },
  Free: { label: "Free", days: 0 },
};

/**
 * Checkout. With RAZORPAY_KEY_ID/SECRET set, paid offers open a Razorpay order and stay Pending until
 * /api/public/checkout/verify confirms the signature. Without them it is TEST MODE: "paying" records a
 * successful order for the creator. The price is always computed here from the mango and coupon,
 * never taken from the browser. Plug Razorpay/Stripe in here for real payments.
 * Disabled in production unless ENABLE_TEST_CHECKOUT=1 (otherwise anyone could create free "paid" orders).
 */
export async function POST(req: Request) {
  if (await rateLimited("checkout", 15)) return NextResponse.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim().slice(0, 80);
  const email = String(body.email || "").trim().toLowerCase().slice(0, 120);
  const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
  const code = String(body.coupon || "").trim().toUpperCase().slice(0, 40);
  const preview = Boolean(body.preview);
  const live = razorpayConfigured();
  if (!preview && !live && process.env.NODE_ENV === "production" && process.env.ENABLE_TEST_CHECKOUT !== "1") {
    return NextResponse.json({ error: "Online payments aren't enabled yet" }, { status: 503 });
  }
  if (!preview && (!name || !/^\S+@\S+\.\S+$/.test(email))) {
    return NextResponse.json({ error: "Enter your name and a valid email" }, { status: 400 });
  }

  try {
    const out = await store.tx(async (t) => {
      const mango = await t.get("mangoes", String(body.mangoId || ""));
      if (!mango || !mango.active) throw new Error("This offering is no longer available");
      if (asUser(await t.get("users", String(mango.userId)))?.suspended) throw new Error("This offering is no longer available");
      const type = String(mango.type || "One-time");
      const base = type === "Free" ? 0 : Number(mango.discountPrice || mango.price || 0);
      let price = base;
      let applied: string | undefined;

      if (code) {
        if (type.includes("ubscription")) throw new Error("Coupons can't be used on subscription mangoes");
        const coupons = await t.find("coupons", [["userId", mango.userId]]);
        const c = coupons.find((x) => String(x.code).toUpperCase() === code && x.active);
        if (!c) throw new Error("Invalid coupon code");
        const used = (await t.find("sales", [["userId", mango.userId], ["coupon", code]])).filter((s) => s.status === "Success").length;
        if (c.mango && c.mango !== "All mangoes" && c.mango !== mango.title) throw new Error("This coupon isn't valid for this offering");
        if (c.start && new Date(String(c.start)).getTime() > Date.now()) throw new Error("This coupon isn't active yet");
        if (c.end && new Date(String(c.end)).getTime() < Date.now()) throw new Error("This coupon has expired");
        if (c.maxUses && used >= Number(c.maxUses)) throw new Error("This coupon has reached its usage limit");
        if (c.targetEmails && !String(c.targetEmails).toLowerCase().split(/[\s,]+/).includes(email)) throw new Error("This coupon isn't available for your account");
        price = Math.max(0, Math.round(base * (1 - Number(c.discount || 0) / 100)));
        applied = code;
      }
      if (preview) return { price, coupon: applied, saleId: undefined, creatorId: undefined, title: undefined, expires: undefined };

      if ((await t.find("blocked", [["userId", mango.userId], ["email", email]], { limit: 1 })).length) throw new Error("You can't purchase from this creator");

      const SUB: Record<string, number> = { Monthly: 30, Quarterly: 91, "Half-yearly": 182, Yearly: 365 };
      const cycle = type === "Subscription" ? { label: String(mango.cycle || "Monthly"), days: SUB[String(mango.cycle || "Monthly")] || 30 } : CYCLE[type] || CYCLE["One-time"];
      const expires = cycle.days ? new Date(Date.now() + cycle.days * 864e5).toISOString() : null;
      const saleId = id();
      const needsPay = live && price > 0;
      t.set("sales", saleId, {
        userId: mango.userId, createdAt: now(), customer: name, email, phone, mango: mango.title, mangoId: mango.id,
        amount: price, quantity: 1, cycle: cycle.label, method: needsPay ? "Razorpay" : "Test checkout", status: needsPay ? "Pending" : "Success", coupon: applied, expires,
        ref: typeof body.ref === "string" ? body.ref.toUpperCase().slice(0, 40) : undefined,
      });
      if (!needsPay) for (const l of await t.find("leads", [["userId", mango.userId], ["type", "dropoff"], ["email", email]])) if (l.mango === mango.title) t.delete("leads", l.id);
      return { price, coupon: applied, saleId, creatorId: String(mango.userId), title: String(mango.title), expires, needsPay };
    });
    if (out.saleId && out.creatorId && out.title) {
      if (out.needsPay) {
        // real payment: open a Razorpay order; the sale stays Pending until the signature is verified
        try {
          const o = await createOrder(out.price, out.saleId, { saleId: out.saleId, email });
          await store.write([{ type: "update", coll: "sales", id: out.saleId, patch: { rzpOrderId: o.id } }]);
          return NextResponse.json({ ok: true, price: out.price, coupon: out.coupon, saleId: out.saleId, razorpay: { orderId: o.id, keyId: razorpayKeyId(), amount: o.amount, name, email, phone } });
        } catch (e) {
          await store.write([{ type: "update", coll: "sales", id: out.saleId, patch: { status: "Failed", failReason: (e as Error).message.slice(0, 200) } }]);
          return NextResponse.json({ error: "Could not start the payment. Please try again." }, { status: 502 });
        }
      }
      await afterSuccess(out.saleId);
      return NextResponse.json({ ok: true, price: out.price, coupon: out.coupon, saleId: out.saleId });
    }
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
