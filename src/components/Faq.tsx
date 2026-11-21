"use client";
import { useState } from "react";
import SplitHeading from "./SplitHeading";
import Reveal from "./Reveal";
import { BRAND } from "@/lib/brand";
import { FLOWS } from "@/lib/growth/model";

const faqs: Record<string, [string, string][]> = {
  "Getting started": [
    ["I am one person. Can I run this alone?", "Yes. Lead capture, reminders, follow-ups and the learner portal run by themselves. You step in for the discovery conversation and for feedback on assignments."],
    ["What is the Pattern Check?", "A short online form with four patterns and four statements under each. The person ticks what sounds like them, enters name, email and WhatsApp, and sees a scored result. You are alerted and the answers are saved to the lead record."],
    ["How does the free masterclass work?", "People register for a live two-hour session with numbered seats. They get a confirmation, reminders at 24 hours, 3 hours, 1 hour and 10 minutes, and a replay for 48 hours."],
    ["Do I need Zoom or Google Meet?", "No. Masterclasses, discovery calls and live classes can use a built-in video room, created automatically when you leave the link empty."],
  ],
  "Funnel and follow-ups": [
    [`What are the ${FLOWS.length} workflows?`, "They follow the real funnel: social lead, lead magnet, Pattern Check completed, masterclass registered and attended, discovery call booked, no-show and follow-up, application sent, unpaid enrolment, payment successful, refund processed, class notices, drop-off rescue and programme completed."],
    ["Will people get sales messages after they pay?", "No. Each workflow has a stop rule. Anyone who books, pays or says no stops receiving the sales messages."],
    ["Who gets WhatsApp messages?", "Only people who ticked the opt-in on a form. Every email carries an unsubscribe link."],
    ["Can I see which messages work?", "Yes. For every message you see sent, opened, clicked and acted on, so you can cut the ones that do not help."],
  ],
  "Payments and portal": [
    ["How do learners pay?", "Through Razorpay, by card, UPI or net banking. A receipt page and email are created automatically, and a failed payment starts a reminder sequence."],
    ["What happens after payment?", "The learner gets a portal login, a welcome message with the kick-off date and pre-work, live class links, assignments, feedback and a certificate at the end."],
    ["How do refunds work?", "Open Transactions and press Refund on the order. The money goes back through Razorpay and the learner receives a confirmation by email and WhatsApp."],
  ],
  "Privacy and control": [
    ["Who can see lead records?", "Only you and team members you name. The form tells people their answers will be used to prepare for the conversation."],
    ["Who owns the data?", "You do. Leads, sales and content stay in your own database, and you can export them."],
  ],
};

export default function Faq() {
  const cats = Object.keys(faqs);
  const [cat, setCat] = useState(cats[0]);
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" className="relative bg-white px-4 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.6fr]">
        <div className="min-w-0">
          <SplitHeading
            className="!justify-start font-display text-[32px] font-bold leading-[1.15] tracking-tight text-ink max-md:!justify-center md:text-[44px]"
            segments={[{ text: "Got questions", br: true }, { text: "about" }, { text: BRAND, gradient: true }]}
          />
          <p className="mt-4 text-ink/60">Find answers to commonly asked questions.</p>
          <div className="mt-8 flex gap-2 overflow-x-auto md:flex-col">
            {cats.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCat(c);
                  setOpen(0);
                }}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-left text-[15px] font-medium transition ${c === cat ? "bg-[#f4f1ec] text-ink" : "text-ink/60 hover:text-ink"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <Reveal delay={0.2} className="space-y-3">
          {faqs[cat].map(([q, a], k) => {
            const isOpen = open === k;
            return (
              <div key={cat + q} style={{ ["--delay" as string]: `${k * 0.05}s` }} className={`animate-soft-fade rounded-2xl border bg-white transition-colors ${isOpen ? "border-orange-300" : "border-black/10"}`}>
                <button onClick={() => setOpen(isOpen ? -1 : k)} className="flex w-full items-start justify-between gap-4 p-5 text-left font-semibold text-ink">
                  {q}
                  <span className={`text-xl leading-none text-ink/50 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>{isOpen ? "−" : "+"}</span>
                </button>
                <div className={`grid transition-all duration-300 ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
                  <p className="overflow-hidden px-5 text-[15px] leading-relaxed text-ink/60">
                    <span className="block pb-5">{a}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
