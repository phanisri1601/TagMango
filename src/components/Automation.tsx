import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";
import { FLOWS } from "@/lib/growth/model";

const names = FLOWS.map((f) => f.name);
const half = Math.ceil(names.length / 2);
const rows = [names.slice(0, half), names.slice(half)];

const POINTS = [
  ["Stops at the right moment", "Nobody gets a sales message after they book or pay. Each workflow has its own stop rule."],
  ["Opened, clicked, acted on", "For every message you see sent, opened, clicked and whether the person did what it asked. Cut the ones that do not work."],
  ["WhatsApp only with consent", "WhatsApp goes to people who ticked the opt-in. Every email carries an unsubscribe link."],
  ["You are alerted, not buried", "A completed Pattern Check, a booked call or a stuck payment sends you a short alert by email and WhatsApp."],
];

/** Two rows of workflow names drift in opposite directions; four promise cards sit below. */
export default function Automation() {
  return (
    <section id="automation" className="relative overflow-hidden bg-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-ink/50">Email and WhatsApp, on autopilot</p>
        <SplitHeading className="mt-4 font-display text-[32px] font-bold leading-[1.1] tracking-tight text-ink md:text-[48px]" segments={[{ text: `${FLOWS.length} workflows`, gradient: true }, { text: "that follow", br: true }, { text: "your real funnel" }]} />
      </div>
      <div className="mt-12 space-y-3 [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
        {rows.map((row, ri) => (
          <div key={ri} className="flex overflow-hidden">
            <div className={`flex shrink-0 gap-3 pr-3 ${ri ? "[animation:marquee_46s_linear_infinite_reverse]" : "animate-marquee"}`}>
              {[...row, ...row, ...row, ...row].map((n, i) => (
                <span key={i} className="whitespace-nowrap rounded-full border border-black/10 bg-[#f6f2ef] px-5 py-2.5 text-[14px] text-ink/80">{n}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-14 grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {POINTS.map(([t, d], i) => (
          <Reveal key={t} delay={i * 0.08}>
            <div className="h-full rounded-[24px] border border-black/[0.06] bg-[#f6f2ef] p-6 transition duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.3)]">
              <span className="bg-mango grid h-9 w-9 place-items-center rounded-full font-display text-[14px] font-bold text-white">{i + 1}</span>
              <h3 className="mt-4 font-display text-[17px] font-bold leading-tight text-ink">{t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink/65">{d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
