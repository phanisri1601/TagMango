import SiteForm from "@/components/site/SiteForm";
import { H1, Label, Section } from "@/components/site/ui";
import { siteData } from "@/lib/site/data";
import { DEFAULT_CONSENT } from "@/lib/growth/model";

import { Head, Steps, Questions } from "@/components/site/blocks";

export const metadata = { title: "Apply" };

export default async function Apply() {
  const { g } = await siteData();
  return (
    <>
    <Section className="grid gap-12 sm:grid-cols-[1fr_1.1fr]">
      <div>
        <Label>Apply and enrol</Label>
        <H1 className="mt-4">Apply</H1>
        <p className="mt-6 max-w-md text-[18px] font-light leading-relaxed text-[#3d3b36]">Tell us a little about where you are. Every application is read personally and answered within two working days.</p>
      </div>
      <div className="border border-[#1c1c1c] bg-[#faf9f6] p-6">
        <SiteForm kind="apply" consent={g?.consentLine || DEFAULT_CONSENT} cta="Send application" done={<><p className="text-[22px]" style={{ fontFamily: "var(--font-vietnam)" }}>Application received.</p><p className="mt-2 text-[15px] font-light">We have emailed you a note and a link to pick a time for a short conversation.</p></>} />
      </div>
    </Section>
      <Section><Head label="What happens next" title="After you apply" /><Steps items={[{ t: "You get a confirmation", d: "An email right away, and a WhatsApp note if you opted in." }, { t: "We read your application", d: "Personally, within two working days." }, { t: "Pick a time to talk", d: "A short one-to-one conversation to see if the programme fits." }, { t: "Decide with no pressure", d: "If it is a yes, you get the enrol link. If not, we say so." }]} /></Section>
      <Section><Head label="Questions" title="Before you apply" /><Questions items={[["Does applying cost anything?", "No. Applying and the discovery conversation are free."], ["How much time does the programme need?", "About four hours a week for six weeks, including the live class."], ["Who sees my answers?", "Only the coach and named team members. Your answers are used to prepare for our conversation."]]} /></Section>
    </>
  );
}
