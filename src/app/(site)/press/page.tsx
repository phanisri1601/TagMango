import { Button, Card, H1, Label, Section, serif } from "@/components/site/ui";
import { siteData } from "@/lib/site/data";

import { Head, Cards, Checks, CtaBand } from "@/components/site/blocks";

export const metadata = { title: "Press and media" };

export default async function Press() {
  const { g } = await siteData();
  const coach = g?.coachName || "Nitienaa Rao";
  return (
    <>
    <Section>
      <Label>Footer and utility</Label>
      <H1 className="mt-4">Press and media</H1>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        <Card strong><h2 className="text-[26px]" style={serif}>Short bio</h2><p className="mt-3 text-[16px] font-light leading-relaxed text-[#3d3b36]">{coach} is a coach who helps people see the patterns that run their choices, through {g?.programme || "THE HUMAN OS™"}, a six-week programme.</p><p className="mt-3 text-[13px] text-[#8a867d]">Draft. Replace with your approved bio.</p></Card>
        <Card strong><h2 className="text-[26px]" style={serif}>For interviews and speaking</h2><p className="mt-3 text-[16px] font-light leading-relaxed text-[#3d3b36]">Podcasts, articles, panels and talks are welcome. Use the contact page with a short note about the format and audience.</p><div className="mt-5"><Button href="/contact">Contact</Button></div></Card>
      </div>
    </Section>
      <Section><Head label="Topics" title="What the coach can talk about" /><Checks items={["Why the same situation keeps repeating", "Patterns at work: saying yes, staying silent, chasing approval", "Why good advice does not stick", "Coaching versus therapy, and where the line is", "Building a pause between trigger and response", "Designing a short, practical coaching programme"]} /></Section>
      <Section><Head label="Facts" title="At a glance" /><Cards cols={4} items={[{ t: "Programme", d: "THE HUMAN OS™" }, { t: "Length", d: "Six weeks" }, { t: "Format", d: "Live classes, lessons, assignments" }, { t: "Free entry points", d: "Pattern Check and live masterclass" }]} /></Section>
      <CtaBand title="Working on a story?" text="Send a short note about the format and the audience." primary={["Contact", "/contact"]} />
    </>
  );
}
