import Link from "next/link";
import Reveal from "@/components/Reveal";
import { Label, Section, H2, wrap } from "./ui";

const card = "h-full rounded-[24px] border border-black/[0.06] bg-[#f6f2ef] p-6 transition duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.3)]";

/** Section heading: small label, large title, optional lead. */
export function Head({ label, title, lead }: { label?: string; title: string; lead?: string }) {
  return (
    <Reveal className="max-w-2xl">
      {label ? <Label>{label}</Label> : null}
      <H2 className="mt-3">{title}</H2>
      {lead ? <p className="mt-4 text-[17px] font-light leading-relaxed text-[#4a4843]">{lead}</p> : null}
    </Reveal>
  );
}

/** Grid of cards that rise in one after another. */
export function Cards({ items, cols = 3 }: { items: { t: string; d: string; n?: string }[]; cols?: 2 | 3 | 4 }) {
  const c = cols === 2 ? "sm:grid-cols-2" : cols === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={`mt-10 grid gap-4 ${c}`}>
      {items.map((x, i) => (
        <Reveal key={x.t} delay={(i % cols) * 0.08}>
          <div className={card}>
            {x.n ? <span className="bg-mango grid h-9 w-9 place-items-center rounded-full text-[13px] font-bold text-white">{x.n}</span> : null}
            <h3 className={`font-display text-[18px] font-bold leading-tight text-ink ${x.n ? "mt-4" : ""}`}>{x.t}</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink/65">{x.d}</p>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

/** Numbered steps joined by a line. */
export function Steps({ items }: { items: { t: string; d: string }[] }) {
  return (
    <ol className="mt-10 max-w-3xl">
      {items.map((x, i) => (
        <Reveal key={x.t} delay={i * 0.08}>
          <li className="relative flex gap-5 pb-8 last:pb-0">
            {i < items.length - 1 && <span className="absolute left-[19px] top-11 h-[calc(100%-2.5rem)] w-px bg-black/15" />}
            <span className="bg-mango relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white">{i + 1}</span>
            <div><h3 className="font-display text-[19px] font-bold text-ink">{x.t}</h3><p className="mt-1 text-[15px] leading-relaxed text-ink/65">{x.d}</p></div>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}

export function Checks({ items, cols = 2 }: { items: string[]; cols?: 1 | 2 }) {
  return (
    <ul className={`mt-8 grid gap-x-10 gap-y-3 ${cols === 2 ? "sm:grid-cols-2" : ""}`}>
      {items.map((x, i) => (
        <Reveal key={x} delay={(i % 4) * 0.05}>
          <li className="flex gap-3 border-b border-black/10 pb-3 text-[15px] leading-relaxed text-ink/80"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--ac2)" }} />{x}</li>
        </Reveal>
      ))}
    </ul>
  );
}

/** Questions with no JavaScript: native details/summary. */
export function Questions({ items }: { items: [string, string][] }) {
  return (
    <div className="mt-8 max-w-3xl divide-y divide-black/10 border-y border-black/10">
      {items.map(([q, a]) => (
        <details key={q} className="group py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[17px] font-bold text-ink">
            {q}<span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-black/15 text-[18px] leading-none transition-transform duration-300 group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 pr-10 text-[15px] leading-relaxed text-ink/65">{a}</p>
        </details>
      ))}
    </div>
  );
}

/** Closing call to action band. */
export function CtaBand({ title, text, primary, secondary }: { title: string; text?: string; primary: [string, string]; secondary?: [string, string] }) {
  return (
    <section className={`${wrap} pb-20`}>
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] bg-[#141414] px-6 py-14 text-center text-white sm:px-12">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full opacity-40 blur-[90px]" style={{ background: "var(--ac1)" }} />
          <h2 className="relative font-display text-[28px] font-bold leading-tight tracking-tight sm:text-[38px]">{title}</h2>
          {text ? <p className="relative mx-auto mt-3 max-w-xl text-white/65">{text}</p> : null}
          <div className="relative mt-7 flex flex-wrap justify-center gap-3">
            <Link href={primary[1]} className="bg-mango rounded-full px-8 py-3.5 text-[15px] font-semibold text-white transition hover:brightness-110">{primary[0]}</Link>
            {secondary ? <Link href={secondary[1]} className="rounded-full border border-white/15 bg-white/[0.06] px-8 py-3.5 text-[15px] font-semibold text-white transition hover:bg-white/[0.12]">{secondary[0]}</Link> : null}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export { Section };
