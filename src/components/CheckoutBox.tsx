"use client";
import { useEffect, useState } from "react";

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open(): void; on(ev: string, cb: (r: { error?: { description?: string } }) => void): void } } }
const loadRzp = () => new Promise<boolean>((res) => {
  if (window.Razorpay) return res(true);
  const el = document.createElement("script");
  el.src = "https://checkout.razorpay.com/v1/checkout.js";
  el.onload = () => res(true);
  el.onerror = () => res(false);
  document.body.appendChild(el);
});

type Props = { mangoId: string; title: string; price: number; type: string; cycle?: string; terms?: string; successText?: string; successButton?: string; redirectUrl?: string; accent?: string };

export default function CheckoutBox({ mangoId, title, price, type, cycle, terms, successText, successButton, redirectUrl, accent = "#141413" }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [coupon, setCoupon] = useState("");
  const [agree, setAgree] = useState(false);
  const [ref, setRef] = useState<string>();
  const [final, setFinal] = useState(price);
  const [msg, setMsg] = useState<{ t: string; ok: boolean }>();
  const [done, setDone] = useState<{ price: number; saleId: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const r = new URLSearchParams(location.search).get("ref");
    if (r) {
      setRef(r);
      setCoupon((c) => c || r.toUpperCase());
    }
  }, []);

  const call = (preview: boolean) =>
    fetch("/api/public/checkout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mangoId, name, email, phone, coupon, preview, ref }) }).then((r) => r.json());

  if (done) {
    return (
      <div style={{ ["--ck" as string]: accent }} className="animate-soft-fade rounded-2xl border border-[#ededed] bg-white p-6 text-center shadow-[0_20px_50px_-25px_rgba(0,0,0,0.3)]">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[var(--ck,#2e9e4f)] text-[26px] text-white">✓</div>
        <p className="mt-3 text-[20px] font-semibold">Payment Successful</p>
        <p className="text-[24px] font-bold">₹{done.price.toLocaleString("en-IN")}</p>
        <div className="mt-4 space-y-1.5 rounded-lg bg-[#f7f7f8] p-4 text-left text-[13px]">
          {[["Transaction ID", done.saleId.toUpperCase()], ["Service", title], ["Payment Method", "Online"], ["Payment Time", new Date().toLocaleString("en-IN")], ["Billing Details", `${name} · ${email}`]].map(([k, v]) => <div key={k} className="flex justify-between gap-3"><span className="text-[#6b6b7b]">{k}</span><b className="truncate">{v}</b></div>)}
        </div>
        <a href={`/confirmation?sale=${done.saleId}`} className="mt-4 block rounded-lg border border-[#e1e1e1] py-2.5 text-[14px] font-medium">View receipt</a>
        {successText ? <p className="mt-4 whitespace-pre-wrap text-left text-[14px] text-[#4a4a59]">{successText}</p> : null}
        <a href={redirectUrl || "/web/login"} style={{ background: accent }} className="mt-5 block rounded-lg py-3 text-center font-semibold text-white">{successButton || "Login Now"}</a>
      </div>
    );
  }

  const inp = "w-full rounded-lg border border-[#e1e1e1] px-3.5 py-2.5 text-[14px] outline-none focus:border-[var(--ck,#141413)]";
  return (
    <form
      style={{ ["--ck" as string]: accent }}
      className="space-y-3 rounded-2xl border border-[#ededed] bg-white p-6 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.3)]"
      onSubmit={async (e) => {
        e.preventDefault();
        if (terms && !agree) return setMsg({ t: "Please accept the Terms & Conditions", ok: false });
        setBusy(true);
        const r = await call(false);
        if (r.error) { setBusy(false); return setMsg({ t: r.error, ok: false }); }
        if (!r.razorpay) { setBusy(false); return setDone({ price: r.price, saleId: r.saleId }); }
        // real payment through Razorpay
        if (!(await loadRzp())) { setBusy(false); return setMsg({ t: "Could not load the payment window. Check your connection and try again.", ok: false }); }
        const rz = r.razorpay as { orderId: string; keyId: string; amount: number };
        const fail = (reason: string) => fetch("/api/public/checkout/failed", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ saleId: r.saleId, reason }) }).catch(() => {});
        let paid = false;
        const box = new window.Razorpay!({
          key: rz.keyId, amount: rz.amount, currency: "INR", order_id: rz.orderId, name: title, description: "Secure payment",
          prefill: { name, email, contact: phone }, theme: { color: accent },
          handler: async (resp: Record<string, string>) => {
            paid = true;
            const v = await fetch("/api/public/checkout/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ saleId: r.saleId, ...resp }) }).then((x) => x.json()).catch(() => ({ error: "Network error" }));
            setBusy(false);
            if (v.error) return setMsg({ t: `${v.error}. If money was deducted, it is held and will be matched automatically. Contact us with order ${String(r.saleId).toUpperCase()}.`, ok: false });
            setDone({ price: v.price, saleId: r.saleId });
          },
          modal: { ondismiss: () => { if (!paid) { setBusy(false); setMsg({ t: "Payment not completed. You can try again; we have saved your details.", ok: false }); fail("Window closed"); } } },
        });
        box.on("payment.failed", (e) => { setMsg({ t: e.error?.description || "Payment failed. Please try again.", ok: false }); fail(e.error?.description || "Payment failed"); });
        box.open();
      }}
    >
      <p className="text-[13px] text-[#6b6b7b]">{type === "Subscription" ? `${cycle || "Monthly"} subscription` : type === "Free" ? "Free" : "One-time payment"}</p>
      <p className="text-[30px] font-bold">
        {final ? `₹${final.toLocaleString("en-IN")}` : "Free"}
        {final !== price && <s className="ml-2 text-[16px] font-normal text-[#9b9bab]">₹{price.toLocaleString("en-IN")}</s>}
      </p>
      <input className={inp} placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className={inp} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => /^\S+@\S+\.\S+$/.test(email) && fetch("/api/public/dropoff", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mangoId, email, name }) }).catch(() => {})} required />
      <input className={inp} inputMode="numeric" maxLength={10} placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
      {type !== "Subscription" && price > 0 && (
        <div className="flex gap-2">
          <input className={inp} placeholder="Have a coupon?" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
          <button type="button" className="shrink-0 rounded-lg border border-[#e1e1e1] px-4 text-[14px]" onClick={async () => {
            if (!coupon) return;
            const r = await call(true);
            if (r.error) { setFinal(price); return setMsg({ t: r.error, ok: false }); }
            setFinal(r.price);
            setMsg({ t: "Coupon applied", ok: true });
          }}>Apply</button>
        </div>
      )}
      {terms ? (
        <label className="flex gap-2 text-[12px] text-[#4a4a59]"><input type="checkbox" className="mt-0.5 accent-[var(--ck,#141413)]" checked={agree} onChange={(e) => setAgree(e.target.checked)} /><span>I agree to the <details className="inline"><summary className="inline cursor-pointer text-[#141413]">Terms &amp; Conditions</summary><span className="mt-1 block whitespace-pre-wrap">{terms}</span></details></span></label>
      ) : null}
      {msg && <p className={`text-[13px] ${msg.ok ? "text-[#00a400]" : "text-[#ff4d4f]"}`}>{msg.t}</p>}
      <button disabled={busy} style={{ background: accent }} className="w-full rounded-lg py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-60">
        {busy ? "Processing…" : final ? `Proceed to pay ₹${final.toLocaleString("en-IN")}` : "Get access"}
      </button>
      <p className="text-center text-[11px] text-[#9b9bab]">Payments are processed securely by Razorpay. In test mode no real money moves.</p>
    </form>
  );
}
