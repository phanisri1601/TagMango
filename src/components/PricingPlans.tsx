"use client";
import { useState } from "react";
import Link from "next/link";
import { Arrow } from "./ui";
import { PLAN_CARDS } from "@/lib/planInfo";

const plans = PLAN_CARDS.map((p) => ({ name: p.name, price: p.price, unit: p.unit, fee: p.fee, lead: p.lead || "", popular: p.popular, items: p.items }));

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 10.5 3 3 7-7" />
    </svg>
  );
}

export default function PricingPlans() {
  const [sel, setSel] = useState(2);

  return (
    <section className="bg-[#f4f2ed] px-4 py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-6 rounded-[28px] border border-black/5 bg-white p-6 md:flex-row md:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-500">Freedom Setup</p>
            <p className="mt-1 text-ink/60">To unlock your own branding (custom domain)</p>
          </div>
          <p className="font-display text-3xl font-bold">
            ₹24,999 <span className="text-sm font-medium text-ink/50">+ GST / year</span>
          </p>
        </div>

        <p className="mt-14 text-center text-xs font-semibold uppercase tracking-wider text-ink/40">Available plans</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, i) => (
            <div
              key={p.name}
              onClick={() => setSel(i)}
              style={{ ["--delay" as string]: `${i * 0.08}s` }}
              className={`animate-plan-show relative flex cursor-pointer flex-col rounded-[24px] border-2 bg-white p-6 text-left transition ${sel === i ? "border-orange-400 shadow-[0_20px_50px_-20px_rgba(var(--accent-rgb),0.45)]" : "border-transparent hover:border-orange-200"}`}
            >
              {p.popular && <span className="bg-mango absolute -top-3 left-6 rounded-full px-3 py-0.5 text-xs font-semibold text-white">Most popular</span>}
              <p className="font-display text-xl font-semibold">{p.name}</p>
              <p className="mt-4 font-display text-4xl font-bold">{p.price}</p>
              <p className="text-sm text-ink/50">{p.unit}</p>
              <p className="mt-2 font-semibold text-orange-600">{p.fee}</p>
              <p className="text-xs text-ink/40">(including Indian payment gateway)*</p>
              <Link
                href="/demo"
                className={`mt-5 inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold ${sel === i ? "bg-mango text-white" : "bg-ink text-white"}`}
              >
                Book a Call <Arrow />
              </Link>
              {p.lead && <p className="mt-6 text-sm font-semibold">{p.lead}</p>}
              <ul className={`space-y-2 text-sm text-ink/70 ${p.lead ? "mt-3" : "mt-6"}`}>
                {p.items.map((it) => (
                  <li key={it} className="flex gap-2">
                    <Check />
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-ink/50">*International payment gateway charges are exclusive. All variable charges are exclusive of GST.</p>

      </div>
    </section>
  );
}
