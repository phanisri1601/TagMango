import Link from "next/link";
import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";

const STATS = [
  { v: "20+", l: "years in brand and communications" },
  { v: "₹170 Cr+", l: "growth capital raised as co-founder" },
  { v: "3", l: "institutions: Harvard, IIM Bangalore, Symbiosis" },
];

/** Landing page: who the coach is. Short on purpose; the full story is on the About page. */
export default function MeetHer() {
  return (
    <section id="meet" className="bg-[#f4f2ed] px-4 py-16 md:py-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[auto_minmax(0,1fr)] md:gap-16">
        <Reveal>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nitienaa-rao.webp" alt="Nitienaa Rao" width={1168} height={1336} className="mx-auto aspect-[4/5] w-full max-w-[420px] rounded-[24px] object-cover object-top shadow-[0_24px_60px_-28px_rgba(20,20,19,0.55)] md:mx-0 md:h-[min(74vh,640px)] md:w-auto md:max-w-none" />
        </Reveal>

        <div className="md:max-w-[560px]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-ink/50">Meet your mentor</p>
          <SplitHeading className="mt-3 justify-start text-left font-display text-[36px] font-bold leading-[1.05] tracking-tight text-ink md:text-[52px]" segments={[{ text: "Nitienaa Rao" }]} />
          <p className="mt-1 text-[15px] font-medium text-ink/60">Transformational Identity Mentor</p>
          <Reveal delay={0.1}>
            <p className="mt-6 text-[17px] leading-relaxed text-ink/75">
              Twenty-plus years in boardrooms and high-performance rooms. Now she helps capable people see the pattern that keeps them stuck, and change it.
            </p>
            <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-ink/20 pt-6">
              {STATS.map((s) => (
                <div key={s.v}>
                  <dt className="font-display text-[26px] font-bold leading-none text-ink md:text-[30px]">{s.v}</dt>
                  <dd className="mt-2 text-[12.5px] leading-snug text-ink/65">{s.l}</dd>
                </div>
              ))}
            </dl>
            <Link href="/about" className="mt-8 inline-flex rounded-full bg-ink px-7 py-3.5 text-[14px] font-semibold text-white transition hover:opacity-90">Read her story</Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
