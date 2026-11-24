import { Button, H1, Label, Rule, Section } from "@/components/site/ui";
import { siteData } from "@/lib/site/data";

import { Head, Cards, Steps, Checks, CtaBand } from "@/components/site/blocks";

export const metadata = { title: "About" };

export default async function About() {
  const { g } = await siteData();
  const coach = g?.coachName || "Nitienaa Rao";
  return (
    <>
    <>
      <Section>
        <Label>About</Label>
        <H1 className="mt-4">About {coach}</H1>
        <div className="mt-6 grid items-center gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/nitienaa-rao.webp" alt={coach} width={1168} height={1336} className="aspect-[4/5] w-full max-w-[400px] border border-[#141413] object-cover object-top md:h-[min(48vh,440px)] md:w-auto md:max-w-none" />
          <div className="max-w-[520px]">
            <p className="text-[28px] leading-tight text-[#141413]" style={{ fontFamily: "var(--font-vietnam), system-ui, sans-serif" }}>Hello, I&apos;m {coach}.</p>
            <p className="mt-1 text-[15px] text-[#5c5a55]">Transformational Identity Mentor</p>
            <p className="mt-5 text-[18px] font-light leading-relaxed text-[#5c5a55]">Twenty-plus years in boardrooms and high-performance rooms. Now she helps capable people see the pattern that keeps them stuck, and change it.</p>
            <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-[#141413] pt-5">
              {[["20+", "years in brand and communications"], ["₹170 Cr+", "growth capital raised as co-founder"], ["3", "institutions: Harvard, IIM Bangalore, Symbiosis"]].map(([v, l]) => (
                <div key={v}><dt className="text-[26px] leading-none text-[#141413]">{v}</dt><dd className="mt-2 text-[12.5px] leading-snug text-[#5c5a55]">{l}</dd></div>
              ))}
            </dl>
          </div>
        </div>
        <div className="mt-12 max-w-2xl space-y-5 text-[18px] font-light leading-relaxed text-[#5c5a55]">
          <p>{coach} works with people who are capable, well-liked and still stuck in a loop: the same reaction, the same regret, a different day.</p>
          <p>Her work starts from a simple idea. Most of what we call personality is a set of patterns that formed for good reasons and now run without a vote. When a pattern has a name, it loses some of its grip.</p>
          <p>{g?.programme || "THE HUMAN OS™"} is the programme built from that idea: a six-week path from seeing the pattern to changing how you respond.</p>
        </div>
        <div className="mt-8 flex gap-3"><Button href="/stories">Stories and proof</Button><Button href="/programme" variant="outline">The programme</Button></div>
      </Section>
      <Rule />
    </>
      <Section><Head label="What we believe" title="Three ideas behind the work" /><Cards items={[
        { n: "1", t: "A pattern is not a flaw", d: "It formed for a good reason and kept running. Seeing it clearly is not blame. It is the first step to choosing a different response." },
        { n: "2", t: "Small repeats beat big resolutions", d: "Change comes from a gap you widen a little each week, not from one dramatic decision." },
        { n: "3", t: "Coaching, not therapy", d: "The programme supports reflection and growth. When something needs a clinician, you are pointed to one. That is a promise, not a footnote." },
      ]} /></Section>
      <Section><Head label="Who it is for" title="People who are capable and still stuck in a loop" lead="You do well at work and for others. The same reaction keeps coming back anyway." /><Checks items={["You say yes before you check whether you have the time", "You rehearse conversations more than you have them", "A lukewarm reply stays with you for days", "You compare your progress with other people's scoreboards", "You know what to do, and do the other thing", "You want a method, not just motivation"]} /></Section>
      <Section><Head label="How we work" title="From a free check to a six-week programme" /><Steps items={[{ t: "Take the free Pattern Check", d: "Five minutes, scored on the spot, with your result sent to your email." }, { t: "Join the free masterclass", d: "Two hours, live, with a limited number of seats." }, { t: "Talk it through one to one", d: "A short discovery conversation to see if the programme fits." }, { t: "Join the programme", d: "Six weeks of live classes, practice and feedback in your own learner portal." }]} /></Section>
      <CtaBand title="Start by naming your pattern" text="The free Pattern Check takes five minutes." primary={["Get the free resource", "/free-resource"]} secondary={["Apply", "/apply"]} />
    </>
  );
}
