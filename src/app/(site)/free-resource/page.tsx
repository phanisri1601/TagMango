import SiteForm from "@/components/site/SiteForm";
import { H1, Label, Section } from "@/components/site/ui";
import { siteData } from "@/lib/site/data";
import { DEFAULT_CONSENT } from "@/lib/growth/model";

import { Head, Steps, Checks } from "@/components/site/blocks";

export const metadata = { title: "Free resource" };

export default async function FreeResource() {
  const { g } = await siteData();
  return (
    <>
    <Section className="grid gap-12 sm:grid-cols-[1.1fr_1fr]">
      <div>
        <Label>Resources · Lead magnet</Label>
        <H1 className="mt-4">{String(g?.resourceTitle || "A short guide to noticing your pattern")}</H1>
        <p className="mt-6 max-w-lg text-[18px] font-light leading-relaxed text-[#5c5a55]">Enter your details and it arrives by email right away, with an optional WhatsApp note. We never share your details.</p>
      </div>
      <div className="border border-[#141413] bg-[#ffffff] p-6">
        <SiteForm kind="resource" consent={g?.consentLine || DEFAULT_CONSENT} cta="Send me the resource" done={<><p className="text-[22px]" style={{ fontFamily: "var(--font-vietnam)" }}>Check your email.</p><p className="mt-2 text-[15px] font-light">Your free resource is on its way. If you ticked WhatsApp, you will get a short confirmation there too.</p></>} />
      </div>
    </Section>
      <Section><Head label="What you will get" title="A short guide you can use today" /><Checks items={["Three signs you are running on a pattern", "A one-page way to spot yours", "Questions to ask yourself this week", "A link to the free five-minute Pattern Check"]} /></Section>
      <Section><Head label="How it works" title="Ask, receive, decide" /><Steps items={[{ t: "Fill the short form", d: "Name, email and, if you like, WhatsApp." }, { t: "It arrives by email", d: "Within a minute, with a copy of the link on screen." }, { t: "Take the next step if you wish", d: "The Pattern Check and the free masterclass are optional. You can unsubscribe from any email in one click." }]} /></Section>
    </>
  );
}
