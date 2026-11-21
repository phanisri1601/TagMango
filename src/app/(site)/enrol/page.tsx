import CheckoutBox from "@/components/CheckoutBox";
import { H1, Label, Section } from "@/components/site/ui";
import { siteData } from "@/lib/site/data";

import { Head, Cards, Checks } from "@/components/site/blocks";

export const metadata = { title: "Enrol and pay" };

export default async function Enrol() {
  const { g, mango } = await siteData();
  if (!mango) return <Section><H1>Enrol</H1><p className="mt-6 text-[#6f6c66]">Enrolment opens soon. Please <a className="underline" href="/apply">apply</a> and we will be in touch.</p></Section>;
  const price = mango.type === "Free" ? 0 : Number(mango.discountPrice || mango.price || 0);
  return (
    <>
    <Section className="grid gap-12 sm:grid-cols-[1.1fr_1fr]">
      <div>
        <Label>Apply and enrol</Label>
        <H1 className="mt-4">Enrol and pay</H1>
        <p className="mt-6 text-[26px]" style={{ fontFamily: "var(--font-vietnam)" }}>{String(mango.title)}</p>
        {mango.description ? <p className="mt-3 max-w-lg whitespace-pre-wrap text-[16px] font-light leading-relaxed text-[#3d3b36]">{String(mango.description)}</p> : null}
        <p className="mt-6 text-[13px] text-[#6f6c66]">Pay by card, UPI or netbanking. You will receive a receipt by email and on the next page. See the <a href="/refund-policy" className="underline">refund policy</a>.</p>
        {g?.kickoff ? <p className="mt-2 text-[13px] text-[#6f6c66]">Kick-off: {g.kickoff}</p> : null}
      </div>
      <CheckoutBox accent="#1c1c1c" mangoId={String(mango.id)} title={String(mango.title)} price={price} type={String(mango.type)} cycle={mango.cycle as string | undefined} terms={mango.terms as string | undefined} successText={mango.successText as string | undefined} successButton="Go to the learner portal" redirectUrl="/portal" />
    </Section>
      <Section><Head label="Included" title="What your fee covers" /><Checks items={["Six weeks of live classes with replays", "Weekly lessons and assignments", "Written feedback from your coach", "Your own learner portal", "A certificate and a retest", "Email and WhatsApp reminders"]} /></Section>
      <Section><Head label="Good to know" title="Payment and refunds" /><Cards cols={3} items={[{ t: "Secure payment", d: "Handled by Razorpay. Card details never touch this site." }, { t: "Instant receipt", d: "A receipt page and email as soon as the payment is confirmed." }, { t: "Clear refunds", d: "Read the refund policy. Approved refunds return to your original payment method with a confirmation." }]} /></Section>
    </>
  );
}
