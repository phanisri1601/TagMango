import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";
import Link from "next/link";

const WEEKS = [
  ["01", "See the pattern", "Name yours, and see how strongly it runs."],
  ["02", "Trace where it starts", "Find the moment it switches on."],
  ["03", "What it protects", "Understand what the pattern is guarding."],
  ["04", "The pause", "Build the gap between trigger and response."],
  ["05", "Practise with others", "Try the new response where it counts."],
  ["06", "Hold the change", "Retest, certificate, and the next step."],
];

/** THE HUMAN OS™ programme: six weeks, each card rises in turn. */
export default function Weeks() {
  return (
    <section id="programme" className="relative overflow-hidden bg-[#111111] px-4 py-20 text-white md:py-28">
      <div className="pointer-events-none absolute -right-40 bottom-0 h-[420px] w-[420px] rounded-full opacity-25 blur-[120px]" style={{ background: "var(--ac2)" }} />
      <div className="relative mx-auto max-w-6xl">
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-white/50">THE HUMAN OS™</p>
        <SplitHeading className="mt-4 font-display text-[32px] font-bold leading-[1.1] tracking-tight md:text-[48px]" segments={[{ text: "Six weeks," }, { text: "one new", br: true }, { text: "way to" }, { text: "respond", gradient: true }]} />
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WEEKS.map(([n, t, d], i) => (
            <Reveal key={n} delay={(i % 3) * 0.1}>
              <div className="group relative h-full overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] p-6 transition duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-1.5 hover:bg-white/[0.08]">
                <span className="font-display text-[56px] font-bold leading-none text-white/10 transition-colors duration-500 group-hover:text-white/25">{n}</span>
                <h3 className="mt-3 font-display text-[20px] font-bold">Week {Number(n)} · {t}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-white/60">{d}</p>
                <span className="absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 transition-transform duration-700 [transition-timing-function:var(--ease-out-expo)] group-hover:scale-x-100" style={{ background: "linear-gradient(90deg, var(--ac1), var(--ac2))" }} />
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.2}>
          <ul className="mx-auto mt-10 grid max-w-4xl gap-x-8 gap-y-2 text-[14px] text-white/70 sm:grid-cols-2">
            {["Live classes with a join link in the portal", "Weekly lessons and assignments with written feedback", "Replays if a class is missed, and a gentle nudge to catch up", "A certificate on completion, and a retest of the Pattern Check"].map((x) => <li key={x} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--ac1)" }} />{x}</li>)}
          </ul>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/programme" className="bg-mango rounded-full px-8 py-3.5 text-[15px] font-semibold text-white transition hover:brightness-110">See the programme</Link>
            <Link href="/apply" className="rounded-full border border-white/15 bg-white/[0.06] px-8 py-3.5 text-[15px] font-semibold text-white transition hover:bg-white/[0.12]">Apply</Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
