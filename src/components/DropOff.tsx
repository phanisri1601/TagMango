"use client";
import { useEffect, useRef, useState } from "react";
import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";

const ROWS = [
  { label: "Reached by a link", n: 1000 },
  { label: "Gave name, email, WhatsApp", n: 380 },
  { label: "Registered for the masterclass", n: 190 },
  { label: "Attended live", n: 120 },
  { label: "Booked a discovery call", n: 48 },
  { label: "Enrolled and paid", n: 14 },
];
const GROUPS = ["Interested, not registered", "Registered, did not attend", "Attended, did not book", "Had a call, did not enrol", "Started enrolling, did not pay", "Paid, missed a class", "Half-filled a form"];

/** Drop-off view: bars grow when scrolled into view. Sample numbers, to show what the dashboard looks like. */
export default function DropOff() {
  const ref = useRef<HTMLDivElement>(null);
  const [go, setGo] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setGo(true), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <section id="dropoff" className="relative bg-white px-4 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-ink/50">Know where people leave</p>
          <SplitHeading className="!justify-start mt-4 font-display text-[32px] font-bold leading-[1.1] tracking-tight text-ink max-md:!justify-center md:text-[46px]" segments={[{ text: "See every drop-off," }, { text: "as a number", br: true }, { text: "and a" }, { text: "percentage", gradient: true }]} />
          <Reveal delay={0.15}>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-ink/60">One lead record follows each person through all five steps. Pull up a list of the people stuck at any step, and message them from there.</p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {GROUPS.map((g) => <li key={g} className="rounded-full border border-black/10 bg-[#f4f2ed] px-3 py-1.5 text-[12.5px] text-ink/70">{g}</li>)}
            </ul>
          </Reveal>
        </div>
        <div ref={ref} className="rounded-[28px] border border-black/[0.06] bg-[#f4f2ed] p-5 sm:p-7">
          <div className="flex items-center justify-between"><p className="font-display text-[15px] font-bold">Funnel (sample data)</p><span className="rounded-full bg-ink px-3 py-1 text-[11px] text-white">Last 30 days</span></div>
          <div className="mt-5 space-y-3.5">
            {ROWS.map((r, i) => {
              const prev = i ? ROWS[i - 1].n : r.n;
              const drop = i ? Math.round((1 - r.n / prev) * 100) : 0;
              return (
                <div key={r.label}>
                  <div className="flex items-baseline justify-between gap-3 text-[13px]"><span className="text-ink/80">{r.label}</span><span className="tabular-nums"><b>{r.n.toLocaleString("en-IN")}</b>{i ? <span className="ml-2 text-ink/45">−{drop}%</span> : null}</span></div>
                  <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-black/[0.06]">
                    <div className="h-full rounded-full transition-[width] duration-[1400ms] [transition-timing-function:var(--ease-out-expo)]" style={{ width: go ? `${(r.n / ROWS[0].n) * 100}%` : "0%", transitionDelay: `${i * 120}ms`, background: "linear-gradient(90deg, #5c5a55, #141413)" }} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-[12px] text-ink/45">Sample numbers for illustration. Your own funnel fills in from real leads.</p>
        </div>
      </div>
    </section>
  );
}
