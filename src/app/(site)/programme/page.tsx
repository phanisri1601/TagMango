import { Button, Card, H1, Label, Rule, Section, serif } from "@/components/site/ui";
import { siteData } from "@/lib/site/data";
import { PROGRAMME_WEEKS } from "@/lib/site/content";

import { Head, Cards, Steps, Checks, Questions, CtaBand } from "@/components/site/blocks";

export const metadata = { title: "THE HUMAN OS™" };

/** Name, price and description appear exactly as entered on the programme's mango in the dashboard. */
export default async function Programme() {
  const { g, mango } = await siteData();
  const price = mango ? (mango.type === "Free" ? 0 : Number(mango.discountPrice || mango.price || 0)) : null;
  return (
    <>
    <>
      <Section>
        <Label>Programme</Label>
        <H1 className="mt-4">{mango ? String(mango.title) : g?.programme || "THE HUMAN OS™"}</H1>
        {mango?.description ? <p className="mt-6 max-w-2xl whitespace-pre-wrap text-[18px] font-light leading-relaxed text-[#3d3b36]">{String(mango.description)}</p> : <p className="mt-6 max-w-2xl text-[18px] font-light leading-relaxed text-[#3d3b36]">A six-week programme to see the pattern that runs your choices and build a different response. Live classes, weekly practice and feedback on your work.</p>}
        <div className="mt-8 flex flex-wrap items-center gap-6">
          {price !== null && <p className="text-[34px]" style={serif}>{price ? `₹${price.toLocaleString("en-IN")}` : "Free"}<span className="ml-2 text-[14px] font-light text-[#6f6c66]">{String(mango?.type || "")}</span></p>}
          <Button href="/enrol">Enrol and pay</Button><Button href="/apply" variant="outline">Apply first</Button>
        </div>
      </Section>
      <Rule />
      <Section>
        <Label>Six weeks</Label>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMME_WEEKS.map((w) => <Card key={w}><p className="text-[22px] leading-snug" style={serif}>{w}</p></Card>)}
        </div>
        <ul className="mt-10 grid gap-3 text-[15px] font-light sm:grid-cols-2">
          {["Live classes with a join link in your portal", "Weekly lessons and assignments", "Written feedback from your coach", "A certificate on completion", "Replays if you miss a class", "A retest to see how far you have moved"].map((x) => <li key={x} className="border-b border-[#d6d2c9] pb-2">{x}</li>)}
        </ul>
        {g?.kickoff ? <p className="mt-8 text-[15px] text-[#4a4843]">Kick-off: {g.kickoff}</p> : null}
      </Section>
    </>
      <Section><Head label="Who it is for" title="Is this right for you?" /><Cards cols={2} items={[
        { t: "A good fit if", d: "You notice the same reaction in work, family or money, you can give about four hours a week for six weeks, and you want a method with feedback." },
        { t: "Not the right time if", d: "You are in a crisis or need clinical care, or you cannot set aside weekly time. We will say so honestly and point you to the right support." },
      ]} /></Section>
      <Section><Head label="What you leave with" title="Six weeks from now" /><Checks items={["A clear name for your main pattern, and how it shows up", "A weekly practice you can keep using", "Written feedback on your work from your coach", "A before-and-after Pattern Check score", "A certificate of completion", "Access to your portal and replays"]} /></Section>
      <Section><Head label="A typical week" title="What your week looks like" /><Steps items={[{ t: "Monday: lesson and brief", d: "A short lesson and the week's assignment appear in your portal." }, { t: "Midweek: live class", d: "Join the live session. If you cannot, the replay is ready after." }, { t: "Before the due date: submit", d: "Write your answer in the portal. You get a reminder two days before it is due." }, { t: "After: feedback", d: "Your coach replies in writing, and you get a notice when it is ready." }]} /></Section>
      <Section><Head label="Questions" title="Before you enrol" /><Questions items={[["How do I pay?", "On the Enrol page, by card, UPI or net banking through Razorpay. You get a receipt page and an email straight away."], ["What if I miss a class?", "The replay is in your portal, and you get a gentle nudge to catch up. A second miss alerts your coach."], ["Is there a refund?", "Read the refund policy before you enrol. If a refund is approved it goes back to your original payment method and you get a confirmation by email and WhatsApp."], ["Is this therapy?", "No. It is coaching for reflection and growth."]]} /></Section>
      <CtaBand title="Ready to begin?" primary={["Enrol and pay", "/enrol"]} secondary={["Apply first", "/apply"]} />
    </>
  );
}
