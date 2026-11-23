"use client";
import { use, useEffect, useState } from "react";
import type { InvoiceData } from "@/lib/invoice";

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;

export default function Invoice({ params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = use(params);
  const [d, setD] = useState<InvoiceData | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch(`/api/public/invoice?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`).then((r) => r.json()).then((j) => (j.error ? setErr(j.error) : setD(j))).catch(() => setErr("Network error."));
  }, [kind, id]);
  if (err) return <main className="grid min-h-screen place-items-center bg-[#f5f3ee] p-6 text-center"><div><h1 className="text-[22px] font-semibold">Invoice not available</h1><p className="mt-2 text-[#5c5a55]">{err}</p></div></main>;
  if (!d) return <main className="grid min-h-screen place-items-center bg-[#f5f3ee]"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-[#d3cfc7] border-t-[#141413]" /></main>;
  const date = new Date(d.date).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  return (
    <main className="min-h-screen bg-[#f5f3ee] px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[800px] justify-end gap-2 print:hidden">
        <button onClick={() => window.print()} className="rounded-md bg-[#141413] px-5 py-2.5 text-[14px] font-medium text-white">Download or print PDF</button>
      </div>
      <article className="mx-auto max-w-[800px] bg-white p-8 shadow-sm ring-1 ring-black/5 sm:p-12 print:shadow-none print:ring-0">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b-2 border-[#141413] pb-6">
          <div><p className="font-display text-[26px] font-bold tracking-tight">{d.seller.name}</p><p className="mt-1 text-[13px] text-[#5c5a55]">{d.kind === "plan" ? "Subscription invoice" : "Tax invoice and receipt"}</p></div>
          <div className="text-right"><p className="text-[12px] uppercase tracking-[0.18em] text-[#5c5a55]">Invoice</p><p className="text-[20px] font-semibold">{d.number}</p><p className="text-[13px] text-[#5c5a55]">{date}</p></div>
        </header>
        <section className="mt-6 grid gap-6 sm:grid-cols-2">
          <div><p className="text-[11px] uppercase tracking-[0.18em] text-[#5c5a55]">Billed to</p><p className="mt-1 font-semibold">{d.buyer.name}</p><p className="text-[14px] text-[#5c5a55]">{d.buyer.email}</p>{d.buyer.phone && <p className="text-[14px] text-[#5c5a55]">{d.buyer.phone}</p>}</div>
          <div className="sm:text-right"><p className="text-[11px] uppercase tracking-[0.18em] text-[#5c5a55]">Status</p><p className={`mt-1 inline-block rounded-full px-3 py-0.5 text-[12px] font-semibold uppercase ${d.refunded ? "bg-[#ffe1de] text-[#cf1322]" : "bg-[#dff5df] text-[#0a6b0a]"}`}>{d.refunded ? "Refunded" : d.status}</p>{d.method && <p className="mt-1 text-[13px] text-[#5c5a55]">{d.method}</p>}{d.paymentId && <p className="text-[12px] text-[#5c5a55]">Payment ID {d.paymentId}</p>}</div>
        </section>
        <table className="mt-8 w-full text-left text-[14px]">
          <thead><tr className="border-b border-[#d3cfc7] text-[12px] uppercase tracking-wider text-[#5c5a55]"><th className="py-2">Description</th><th className="py-2 text-right">Amount</th></tr></thead>
          <tbody>
            <tr className="border-b border-[#ededed]"><td className="py-3">{d.item}{d.coupon && <span className="ml-2 text-[12px] text-[#5c5a55]">Coupon {d.coupon}</span>}</td><td className="py-3 text-right">{inr(d.base)}</td></tr>
            {d.gst > 0 && <tr className="border-b border-[#ededed]"><td className="py-3 text-[#5c5a55]">GST @ {d.gstRate}%</td><td className="py-3 text-right">{inr(d.gst)}</td></tr>}
          </tbody>
          <tfoot><tr><td className="pt-4 text-[15px] font-semibold">Total {d.refunded ? "(refunded)" : "paid"}</td><td className="pt-4 text-right text-[20px] font-bold">{inr(d.total)}</td></tr></tfoot>
        </table>
        <p className="mt-10 border-t border-[#ededed] pt-4 text-[12px] leading-relaxed text-[#5c5a55]">This is a computer-generated invoice and needs no signature.{d.kind === "sale" ? ` Sold by ${d.seller.name}. Taxes, where applicable, are included in the amount paid.` : ""} For questions, reply to the email this invoice came with or use the contact page.</p>
      </article>
    </main>
  );
}
