import { Button, H1, Label, Section, serif } from "@/components/site/ui";
import { METHOD_STEPS } from "@/lib/site/content";

import { Head, Cards, Checks, CtaBand } from "@/components/site/blocks";

export const metadata = { title: "The method" };

export default function Method() {
  return (
    <>
    <Section>
      <Label>Programme</Label>
      <H1 className="mt-4">The method</H1>
      <p className="mt-6 max-w-2xl text-[18px] font-light leading-relaxed text-[#5c5a55]">Five moves, in order. Each one is small enough to do in a working week.</p>
      <ol className="mt-10 max-w-3xl">
        {METHOD_STEPS.map((s) => (
          <li key={s.n} className="grid grid-cols-[64px_1fr] gap-4 border-t border-[#141413] py-6">
            <span className="text-[36px] leading-none text-[#5c5a55]" style={serif}>{s.n}</span>
            <div><h2 className="text-[32px] leading-none" style={serif}>{s.t}</h2><p className="mt-2 text-[16px] font-light leading-relaxed text-[#5c5a55]">{s.d}</p></div>
          </li>
        ))}
      </ol>
      <Button href="/apply">Apply</Button>
    </Section>
      <Section><Head label="Principles" title="What makes the method work" /><Cards cols={2} items={[
        { t: "One pattern at a time", d: "We work on the pattern that is strongest for you, not a long list of everything that could change." },
        { t: "Practice in real situations", d: "Each week ends with something small to try at work or at home, and a short note on what happened." },
        { t: "Feedback you can use", d: "Your coach reads your assignments and replies in writing, so the next week starts from where you actually are." },
        { t: "Measured, not guessed", d: "You take the Pattern Check at the start and again at the end, so the change is visible." },
      ]} /></Section>
      <Section><Head label="Inside the programme" title="The tools you use every week" /><Cards items={[
        { t: "Live classes", d: "Small live sessions with a join link in your portal. Missed one? The replay is there." },
        { t: "Lessons", d: "Short lessons and notes you can finish in a working week." },
        { t: "Assignments", d: "A brief, a due date and written feedback from your coach." },
        { t: "Reminders", d: "Gentle email and WhatsApp nudges before classes and when work is due." },
        { t: "Certificate", d: "Issued when you complete the six weeks." },
        { t: "Retest", d: "Repeat the Pattern Check and compare your scores." },
      ]} /></Section>
      <Section><Head label="Good to know" title="What the method is not" /><Checks cols={1} items={["It is not therapy and does not treat any condition.", "It does not promise a result by a fixed date.", "It does not ask you to share more than you choose to."]} /></Section>
      <CtaBand title="See whether it fits" primary={["Apply", "/apply"]} secondary={["The programme", "/programme"]} />
    </>
  );
}
