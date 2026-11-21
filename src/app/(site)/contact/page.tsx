import SiteForm from "@/components/site/SiteForm";
import { H1, Label, Section } from "@/components/site/ui";
import { siteData } from "@/lib/site/data";

import { Head, Cards, Questions } from "@/components/site/blocks";

export const metadata = { title: "Contact" };

export default async function Contact() {
  const { g } = await siteData();
  return (
    <>
    <Section className="grid gap-12 sm:grid-cols-[1fr_1.1fr]">
      <div>
        <Label>Footer and utility</Label>
        <H1 className="mt-4">Contact</H1>
        <p className="mt-6 max-w-md text-[18px] font-light leading-relaxed text-[#3d3b36]">Questions about the programme, an order or a refund? Write here and we reply within two working days.</p>
        {g?.alertEmail ? <p className="mt-4 text-[15px] text-[#6f6c66]">{String(g.alertEmail)}</p> : null}
      </div>
      <div className="border border-[#1c1c1c] bg-[#faf9f6] p-6"><SiteForm kind="contact" consent="" cta="Send message" done={<p className="text-[20px]" style={{ fontFamily: "var(--font-vietnam)" }}>Thank you. Your message has been sent.</p>} /></div>
    </Section>
      <Section><Head label="Ways to reach us" title="Pick what suits you" /><Cards items={[{ t: "Write a message", d: "Use the form above. We reply within two working days." }, { t: "About an order or refund", d: "Quote your receipt number and we will look into it straight away." }, { t: "Media and speaking", d: "See the press page for a short bio and how to ask." }]} /></Section>
      <Section><Head label="Questions" title="Quick answers" /><Questions items={[["How fast will I get a reply?", "Within two working days. Weekends can take a little longer."], ["Where do I find my receipt?", "On the confirmation page after payment, and in the email we sent you."], ["I want to stop emails.", "Use the unsubscribe link at the bottom of any email, or write to us here."]]} /></Section>
    </>
  );
}
