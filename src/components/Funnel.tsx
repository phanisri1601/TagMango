import Reveal from "./Reveal";
import SplitHeading from "./SplitHeading";

const STEPS = [
  { n: "01", t: "Attention", who: "A reel, video or post", what: "Every link is tracked per platform. The link-in-bio page counts clicks on each button.", tag: "Instagram · YouTube · LinkedIn · Facebook" },
  { n: "02", t: "Capture", who: "Pattern Check or masterclass form", what: "Name, email and a WhatsApp opt-in. The source of every lead is saved on the lead's record.", tag: "Half-filled forms are kept too" },
  { n: "03", t: "Free masterclass", who: "Two hours, live, numbered seats", what: "Confirmation, reminders at 24 h, 3 h, 1 h and 10 min, then a 48-hour replay.", tag: "Show-up rate and replay views" },
  { n: "04", t: "Discovery conversation", who: "One to one with the coach", what: "Booking joins the same record. A call card shows what the person scored before you speak.", tag: "No-show? A reschedule goes out in 15 min" },
  { n: "05", t: "The programme", who: "Enrol, pay, learn", what: "Secure checkout, receipt, portal login, live classes, assignments, feedback and a certificate.", tag: "Six weeks, then a retest" },
];

/** The five-step journey. A line draws across the cards as they scroll into view. */
export default function Funnel() {
  return (
    <section id="journey" className="relative bg-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-[12px] font-semibold uppercase tracking-[0.22em] text-ink/50">The journey</p>
        <SplitHeading className="mt-4 font-display text-[32px] font-bold leading-[1.1] tracking-tight text-ink md:text-[48px]" segments={[{ text: "From a scroll", br: true }, { text: "to a" }, { text: "seat", gradient: true }]} />
        <Reveal delay={0.15}><p className="mx-auto mt-5 max-w-2xl text-center text-[16px] leading-relaxed text-ink/60">Every person moves through five steps. You see each of them on one lead record, so you know who someone is before you ever speak to them.</p></Reveal>

        <div className="relative mt-14">
          {/* connecting line: draws itself when the row scrolls into view */}
          <Reveal className="pointer-events-none absolute left-0 right-0 top-[27px] hidden lg:block">
            <div className="mx-[10%] h-px origin-left bg-gradient-to-r from-[var(--ac1)] via-[var(--ac2)] to-[var(--ac3)] [animation:draw-line_1.6s_var(--ease-out-expo)_both_0.3s]" />
          </Reveal>
          <ol className="grid gap-4 lg:grid-cols-5">
            {STEPS.map((s, i) => (
              <li key={s.n}>
                <Reveal delay={i * 0.1} className="group h-full">
                  <div className="relative flex h-full flex-col rounded-[24px] border border-black/[0.06] bg-[#f6f2ef] p-5 transition duration-500 [transition-timing-function:var(--ease-out-expo)] hover:-translate-y-1.5 hover:bg-white hover:shadow-[0_24px_50px_-24px_rgba(0,0,0,0.3)]">
                    <span className="bg-mango relative z-10 grid h-[54px] w-[54px] place-items-center rounded-full font-display text-[16px] font-bold text-white shadow-[0_8px_24px_-8px_rgba(var(--accent-rgb),0.7)] transition-transform duration-500 group-hover:scale-110">{s.n}</span>
                    <h3 className="mt-5 font-display text-[20px] font-bold leading-tight text-ink">{s.t}</h3>
                    <p className="mt-1 text-[13px] font-medium text-ink/50">{s.who}</p>
                    <p className="mt-3 flex-1 text-[14px] leading-relaxed text-ink/70">{s.what}</p>
                    <p className="mt-4 border-t border-black/10 pt-3 text-[12px] text-ink/50">{s.tag}</p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
