"use client";
import { useMemo, useState } from "react";
import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";
import { DEFAULT_PATTERNS, DEFAULT_RULES } from "@/lib/growth/model";

/** A live try-out of the self-scoring Pattern Check: tick statements, watch the four percentages and the result update. */
export default function PatternDemo() {
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const r = DEFAULT_RULES;
  const rows = useMemo(() => DEFAULT_PATTERNS.map((p) => {
    const max = p.bullets.reduce((a, b) => a + b.score, 0);
    const got = p.bullets.filter((b) => picked[b.id]).reduce((a, b) => a + b.score, 0);
    return { id: p.id, name: p.name, blurb: p.blurb, pct: Math.round((got / max) * 100) };
  }), [picked]);
  const any = Object.values(picked).some(Boolean);
  const sorted = [...rows].sort((a, b) => b.pct - a.pct);
  const present = sorted.filter((x) => x.pct >= r.present);
  const primary = present[0];
  const blend = primary ? present.filter((x, i) => i > 0 && primary.pct - x.pct <= r.blend).slice(0, 2) : [];
  const low = any && rows.every((x) => x.pct < r.lowBelow);
  const high = any && rows.every((x) => x.pct >= r.highFrom);
  const result = !any ? "Tick a few statements that sound like you." : !primary ? "None present yet. No pattern is running strongly." : blend.length ? `Blend of ${blend.length + 1}: ${[primary, ...blend].map((x) => x.name).join(" + ")}` : `Single: ${primary.name}`;

  return (
    <section id="pattern-check" className="on-dark relative overflow-hidden bg-[#141413] px-4 py-20 text-white md:py-28">
      <div className="pointer-events-none absolute -left-40 top-10 h-[420px] w-[420px] rounded-full opacity-30 blur-[110px]" style={{ background: "var(--ac1)" }} />
      <div className="relative mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.25fr_1fr]">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/50">Try the Pattern Check</p>
          <SplitHeading as="h2" className="!justify-start mt-4 font-display text-[32px] font-bold leading-[1.1] tracking-tight max-md:!justify-center md:text-[46px]" segments={[{ text: "Name the pattern", br: true }, { text: "that runs" }, { text: "your choices", gradient: true }]} />
          <Reveal delay={0.15}><p className="mt-4 max-w-xl text-white/65">This is the real scoring rule. A pattern is present at 50% or more. Another pattern within 15 points makes it a blend. Your coach can edit every pattern, statement and score.</p></Reveal>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {DEFAULT_PATTERNS.map((p, pi) => (
              <Reveal key={p.id} delay={pi * 0.08}>
                <div className="h-full rounded-[22px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur">
                  <p className="font-display text-[16px] font-bold">{p.name}</p>
                  <div className="mt-3 flex flex-col gap-2">
                    {p.bullets.map((b) => {
                      const on = !!picked[b.id];
                      return (
                        <button key={b.id} type="button" onClick={() => setPicked((s) => ({ ...s, [b.id]: !s[b.id] }))} aria-pressed={on} className={`rounded-xl border px-3 py-2 text-left text-[13px] leading-snug transition duration-300 ${on ? "border-transparent bg-white text-ink shadow-[0_8px_24px_-10px_rgba(255,255,255,0.5)]" : "border-white/10 text-white/70 hover:border-white/30 hover:bg-white/[0.06]"}`}>
                          {b.text}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.2} className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/50">Live result</p>
            <p className="mt-3 min-h-[56px] font-display text-[20px] font-bold leading-snug">{result}</p>
            <div className="mt-5 space-y-4">
              {rows.map((x) => (
                <div key={x.id}>
                  <div className="flex justify-between text-[13px]"><span className="text-white/80">{x.name}</span><span className="font-semibold tabular-nums">{x.pct}%</span></div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-[width] duration-700 [transition-timing-function:var(--ease-out-expo)]" style={{ width: `${x.pct}%`, background: "linear-gradient(90deg, #e9e6e0, #f4f2ed)" }} />
                  </div>
                </div>
              ))}
            </div>
            {(low || high) && <p className="mt-5 rounded-xl bg-white/10 p-3 text-[13px] text-white/80">{low ? "Low across all four. The coach is told to keep the call gentle." : "High across all four. The coach is told to keep the call gentle."}</p>}
            <div className="mt-6 space-y-1.5 border-t border-white/10 pt-4 text-[12.5px] text-white/50">
              <p>Saved to the lead record: name, email, WhatsApp, source, all four percentages, the exact statements picked.</p>
              <p>The coach gets an alert by email and WhatsApp.</p>
            </div>
            <button type="button" onClick={() => setPicked({})} className="mt-5 text-[13px] text-white/60 underline underline-offset-4 hover:text-white">Reset</button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
