"use client";
import { useState } from "react";
import { api, patchMe, toast, useMe, type Me } from "@/lib/client";
import { BRAND } from "@/lib/brand";
import { Btn, Modal } from "@/components/dash/kit";
import { Icon } from "@/components/dash/icons";
import { PLAN_ORDER, type Plan } from "@/components/dash/nav";
import { COMPARE, PLAN_CARDS } from "@/lib/planInfo";

declare global { interface Window { Razorpay?: new (o: Record<string, unknown>) => { open(): void; on(ev: string, cb: (r: { error?: { description?: string } }) => void): void } } }
const loadRzp = () => new Promise<boolean>((res) => {
  if (window.Razorpay) return res(true);
  const el = document.createElement("script");
  el.src = "https://checkout.razorpay.com/v1/checkout.js";
  el.onload = () => res(true);
  el.onerror = () => res(false);
  document.body.appendChild(el);
});

export default function Plans() {
  const { me, setMe } = useMe();
  const [confirm, setConfirm] = useState<Plan | "freedom" | null>(null);
  const [busy, setBusy] = useState(false);
  const cur = PLAN_ORDER.indexOf(me.plan);

  const goingDown = confirm !== null && confirm !== "freedom" && PLAN_ORDER.indexOf(confirm) < cur;
  const price = confirm === "freedom" ? 24999 : confirm ? Number((PLAN_CARDS.find((c) => c.id === confirm)?.price || "0").replace(/[^0-9]/g, "")) : 0;

  async function refreshMe() {
    const r = await api<{ user: Me }>("/api/me");
    setMe(r.user);
    return r.user;
  }

  async function apply() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (goingDown) {
        const r = await patchMe({ plan: confirm });
        setMe(r.user);
        toast(`You're now on ${PLAN_CARDS.find((p) => p.id === confirm)!.name}`);
        setConfirm(null);
        return;
      }
      const o = await api<{ test?: boolean; keyId: string; orderId: string; amount: number; name: string; email: string; phone: string; item: string; testKey: boolean }>("/api/plan/checkout", "POST", confirm === "freedom" ? { kind: "freedom" } : { plan: confirm });
      if (o.test) {
        const r = await patchMe(confirm === "freedom" ? { whiteLabel: true } : { plan: confirm });
        setMe(r.user);
        toast("Plan changed (local test mode, no payment)");
        setConfirm(null);
        return;
      }
      if (!(await loadRzp())) throw new Error("Could not load the payment window. Check your internet and try again.");
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay!({
          key: o.keyId, order_id: o.orderId, amount: o.amount, currency: "INR", name: BRAND, description: o.item,
          prefill: { name: o.name, email: o.email, contact: o.phone }, theme: { color: "#141413" },
          handler: async (res: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            try {
              await api("/api/plan/verify", "POST", { orderId: res.razorpay_order_id, paymentId: res.razorpay_payment_id, signature: res.razorpay_signature });
              await refreshMe();
              toast(confirm === "freedom" ? "Payment received. Freedom Setup is active." : `Payment received. You're now on ${PLAN_CARDS.find((p) => p.id === confirm)!.name}.`);
              setConfirm(null);
              resolve();
            } catch (e) { reject(e); }
          },
          modal: { ondismiss: () => resolve() },
        });
        rzp.on("payment.failed", (f) => reject(new Error(f.error?.description || "The payment failed. No money was taken.")));
        rzp.open();
      });
    } catch (e) {
      toast((e as Error).message, "err");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <div className="animate-rise">
        <h1 className="text-[26px] font-semibold">Plans</h1>
        <p className="text-[14px] text-[#5c5a55]">You are on <b>{PLAN_CARDS[cur].name}</b>. Every feature below is enforced: limits stop at the number shown, and locked pages unlock when you upgrade.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLAN_CARDS.map((p, i) => {
          const idx = PLAN_ORDER.indexOf(p.id);
          const isCur = idx === cur;
          return (
            <div key={p.id} className={`animate-plan-show relative flex flex-col rounded-[14px] border bg-white ${isCur ? "border-[#141413] shadow-[0_14px_36px_-16px_rgba(20,20,19,0.5)]" : "border-[#ededed]"}`} style={{ ["--delay" as string]: `${i * 0.06}s` }}>
              {p.popular && <span className="absolute -top-2.5 left-5 rounded-full bg-[#141413] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Most popular</span>}
              <div className="rounded-t-[14px] bg-[#f4f2ed] p-5">
                <p className="text-[17px] font-semibold">{p.name}</p>
                <p className="mt-2 text-[30px] font-bold leading-none">{p.price}<span className="ml-1 text-[13px] font-normal text-[#5c5a55]">{p.unit}</span></p>
                <p className="mt-2 text-[14px] font-semibold">{p.fee}</p>
                <p className="mt-1 min-h-[34px] text-[12.5px] text-[#5c5a55]">{p.blurb}</p>
                {isCur ? (
                  <span className="mt-3 block rounded-md bg-[#141413] py-2 text-center text-[14px] font-medium text-white">Current plan</span>
                ) : idx > cur ? (
                  <Btn className="mt-3 w-full" onClick={() => setConfirm(p.id)}>Upgrade to {p.name}</Btn>
                ) : (
                  <Btn variant="outline" className="mt-3 w-full" onClick={() => setConfirm(p.id)}>{p.id === "basic" ? "Switch to Basic" : "Downgrade"}</Btn>
                )}
              </div>
              <div className="flex-1 p-5 text-[13px]">
                {p.lead && <p className="mb-2 font-semibold">{p.lead}</p>}
                <ul className="space-y-2">{p.items.map((it) => <li key={it} className="flex gap-2"><Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-[#141413]" />{it}</li>)}</ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="animate-rise overflow-x-auto rounded-[14px] border border-[#ededed] bg-white">
        <table className="w-full min-w-[640px] text-left text-[13.5px]">
          <thead><tr className="bg-[#f4f2ed]"><th className="px-4 py-3 font-semibold">Compare plans</th>{PLAN_CARDS.map((p) => <th key={p.id} className={`px-4 py-3 font-semibold ${p.id === me.plan ? "bg-[#e9e6e0]" : ""}`}>{p.name}</th>)}</tr></thead>
          <tbody>{COMPARE.map((r) => (
            <tr key={r.label} className="border-t border-[#ededed]"><td className="px-4 py-2.5 text-[#3f3e3a]">{r.label}</td>{PLAN_CARDS.map((p) => <td key={p.id} className={`px-4 py-2.5 ${p.id === me.plan ? "bg-[#f4f2ed] font-medium" : ""}`}>{r.v(p.id)}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>

      <div className="animate-rise grid items-center gap-4 rounded-[14px] border border-[#ededed] bg-[#f4f2ed] p-6 md:grid-cols-[1fr_auto]">
        <div>
          <p className="text-[20px]"><b>Freedom</b> Setup</p>
          <p className="text-[13px] text-[#5c5a55]">Use your own web address (custom domain) for your pages.</p>
          <p className="mt-2 text-[26px] font-bold">₹24,999 <span className="text-[13px] font-normal text-[#5c5a55]">+ GST, one-time</span></p>
        </div>
        {me.whiteLabel ? <span className="rounded-md bg-[#141413] px-4 py-2 text-[14px] font-medium text-white">✓ Active</span> : <Btn variant="black" onClick={() => setConfirm("freedom")}>Get Freedom Setup</Btn>}
      </div>
      <p className="text-[12px] text-[#5c5a55]">Commission is charged on each sale and includes the Indian payment gateway fee. International cards cost extra. All charges are plus GST.</p>

      {confirm && (
        <Modal title={confirm === "freedom" ? "Get Freedom Setup" : `Switch to ${PLAN_CARDS.find((p) => p.id === confirm)!.name}`} onClose={() => setConfirm(null)}>
          <p className="text-[14px] text-[#4a4a59]">{goingDown ? "" : `You will pay ₹${price.toLocaleString("en-IN")} + 18% GST (₹${Math.round(price * 1.18).toLocaleString("en-IN")} in total) securely through Razorpay. `}{confirm === "freedom" ? "This unlocks custom domain linking in Platform Settings." : "Your plan changes immediately and features unlock or lock to match. Anything above the new plan's limits stays, but you cannot add more."}</p>
          <div className="mt-5 flex justify-end gap-2"><Btn variant="outline" onClick={() => setConfirm(null)}>Cancel</Btn><Btn onClick={apply} disabled={busy}>{busy ? "Please wait…" : goingDown ? "Confirm" : "Pay and upgrade"}</Btn></div>
        </Modal>
      )}
    </div>
  );
}
