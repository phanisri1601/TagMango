"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { H1, Label, Section, serif } from "@/components/site/ui";

type R = { id: string; status: string; customer: string; email: string; item: string; amount: number; coupon: string | null; method: string; paymentId: string | null; createdAt: string; paidAt: string | null; refundedAt: string | null; seller: string };

function Receipt() {
  const sale = useSearchParams().get("sale") || "";
  const [r, setR] = useState<R | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    if (!sale) return setErr("No order found.");
    fetch(`/api/public/receipt?sale=${encodeURIComponent(sale)}`).then((x) => x.json()).then((j) => (j.error ? setErr("We could not find that order.") : setR(j))).catch(() => setErr("Network error."));
  }, [sale]);
  const rows: [string, string][] = r ? [["Receipt no.", r.id.toUpperCase()], ["Item", r.item], ["Amount", `₹${Number(r.amount).toLocaleString("en-IN")}`], ...(r.coupon ? [["Coupon", r.coupon] as [string, string]] : []), ["Paid by", `${r.customer} · ${r.email}`], ["Method", r.method], ...(r.paymentId ? [["Payment ID", r.paymentId] as [string, string]] : []), ["Date", new Date(r.paidAt || r.createdAt).toLocaleString("en-IN")], ["Sold by", r.seller]] : [];
  const tone = !r ? "" : r.status === "Success" ? "Payment successful" : r.status === "Refunded" ? "Refunded" : r.status === "Pending" ? "Payment pending" : "Payment not completed";
  return (
    <Section className="max-w-[760px]">
      <Label>Apply and enrol · Confirmation</Label>
      <H1 className="mt-4">{r ? tone : "Confirmation"}</H1>
      {err && <p className="mt-6 text-[#b3261e]">{err}</p>}
      {r && (
        <>
          <p className="mt-4 text-[17px] font-light text-[#5c5a55]">{r.status === "Success" ? "Thank you. A receipt has been sent to your email, and your learner portal is open." : r.status === "Pending" ? "We are waiting for the bank to confirm. This page updates when you refresh." : r.status === "Failed" ? "The payment did not go through. You can try again; no money was taken." : ""}</p>
          <dl className="mt-8 border border-[#141413] bg-[#ffffff]">
            {rows.map(([k, v]) => <div key={k} className="grid grid-cols-[130px_1fr] gap-3 border-b border-[#e9e6e0] px-5 py-3 text-[15px] last:border-0"><dt className="text-[#5c5a55]">{k}</dt><dd className="break-words">{v}</dd></div>)}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <button onClick={() => window.print()} className="border border-[#141413] px-6 py-3 text-[14px]">Print or save receipt</button>
            {r.status === "Success" && <a href={`/invoice/sale/${r.id}`} target="_blank" rel="noreferrer" className="border border-[#141413] bg-[#141413] px-6 py-3 text-[14px] text-white">Download invoice</a>}
            {r.status === "Success" && <Link href="/portal" className="bg-[#141413] px-6 py-3 text-[14px] text-[#f4f2ed]">Go to the learner portal</Link>}
            {r.status === "Failed" && <Link href="/enrol" className="bg-[#141413] px-6 py-3 text-[14px] text-[#f4f2ed]">Try again</Link>}
          </div>
          <p className="mt-8 text-[13px] text-[#5c5a55]" style={serif}>Questions about this order? Use the contact page and quote the receipt number.</p>
        </>
      )}
    </Section>
  );
}
export default function Confirmation() { return <Suspense><Receipt /></Suspense>; }
