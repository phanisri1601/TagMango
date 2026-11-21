import { H1, Label, Section, serif } from "@/components/site/ui";
import { siteData, siteStories } from "@/lib/site/data";

import { Head, Cards, CtaBand } from "@/components/site/blocks";

export const metadata = { title: "Stories and proof" };

/** Only real, named testimonials with permission, approved by the coach. */
export default async function Stories() {
  const { g } = await siteData();
  const list = g ? await siteStories(g.userId) : [];
  return (
    <>
    <Section>
      <Label>About</Label>
      <H1 className="mt-4">Stories and proof</H1>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {list.map((t) => (
          <figure key={String(t.id)} className="border border-[#d6d2c9] bg-[#faf9f6] p-6">
            {((t.answers as string[]) || []).filter(Boolean).map((a, i) => <blockquote key={i} className={i === 0 ? "text-[24px] leading-snug" : "mt-3 text-[15px] font-light leading-relaxed text-[#4a4843]"} style={i === 0 ? serif : undefined}>{a}</blockquote>)}
            <figcaption className="mt-4 text-[14px] text-[#6f6c66]">{String(t.name)}</figcaption>
          </figure>
        ))}
      </div>
      {!list.length && <p className="mt-10 text-[#6f6c66]">Stories from learners will appear here once they are approved in the dashboard.</p>}
    </Section>
      <Section><Head label="Why proof matters" title="We only show real, named stories" lead="Every story here is from a learner who gave permission, and the coach approves each one before it appears." /><Cards items={[{ t: "Asked after the programme", d: "Three short questions, in writing or a voice-note link, with a tick to say we may use the answer." }, { t: "Named and approved", d: "No made-up quotes and no anonymous numbers." }, { t: "Your choice", d: "A learner can ask for a story to be removed at any time." }]} /></Section>
      <CtaBand title="Write the next story" text="It starts with a five-minute check." primary={["Get the free resource", "/free-resource"]} secondary={["Apply", "/apply"]} />
    </>
  );
}
