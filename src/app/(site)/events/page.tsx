import { Button, H1, Label, Section, serif } from "@/components/site/ui";
import { store } from "@/lib/db";
import { siteData, siteMasterclasses } from "@/lib/site/data";

import { Head, Cards, Steps, CtaBand } from "@/components/site/blocks";

export const metadata = { title: "Events and workshops" };
const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "full", timeStyle: "short" }) + " IST";

export default async function Events() {
  const { g } = await siteData();
  const mcs = g ? await siteMasterclasses(g.userId) : [];
  const workshops = g ? (await store.find("workshops", [["userId", g.userId]])).filter((w) => w.active !== false) : [];
  return (
    <>
    <Section>
      <Label>Programme</Label>
      <H1 className="mt-4">Events and workshops</H1>
      <h2 className="mt-10 text-[30px]" style={serif}>Free live masterclass</h2>
      <ul className="mt-4 divide-y divide-[#d6d2c9] border-y border-[#d6d2c9]">
        {mcs.map((m) => (
          <li key={String(m.id)} className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div><p className="text-[24px]" style={serif}>{String(m.title)}</p><p className="text-[14px] font-light text-[#6f6c66]">{when(String(m.startsAt))}{m.seats ? ` · ${m.seats} seats` : ""}</p></div>
            {g && <Button href={`/m/${g.slug}`} variant="outline">Reserve a seat</Button>}
          </li>
        ))}
        {!mcs.length && <li className="py-5 text-[#6f6c66]">The next date will be announced here.</li>}
      </ul>
      {workshops.length > 0 && (
        <>
          <h2 className="mt-12 text-[30px]" style={serif}>Workshops</h2>
          <ul className="mt-4 divide-y divide-[#d6d2c9] border-y border-[#d6d2c9]">
            {workshops.map((w) => (
              <li key={String(w.id)} className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div><p className="text-[24px]" style={serif}>{String(w.title)}</p>{w.description ? <p className="line-clamp-2 max-w-xl text-[14px] font-light text-[#6f6c66]">{String(w.description)}</p> : null}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Section>
      <Section><Head label="What to expect" title="Inside the free masterclass" lead="Two hours, live, with numbered seats so everyone can take part." /><Steps items={[{ t: "Arrive and settle in (10 min)", d: "A short welcome and what we will cover." }, { t: "How a pattern works (40 min)", d: "The idea behind the Pattern Check, with examples." }, { t: "Map your own (45 min)", d: "A guided exercise on the situation where you keep reacting the same way." }, { t: "Questions and next step (25 min)", d: "Open questions, then how to book a short one-to-one conversation." }]} /></Section>
      <Section><Head label="Reminders" title="You will not forget it" /><Cards cols={4} items={[{ t: "On booking", d: "Confirmation email with your seat number and join link." }, { t: "24 hours before", d: "A WhatsApp reminder, if you opted in." }, { t: "3 hours and 1 hour", d: "Two more nudges with the join link." }, { t: "10 minutes", d: "A last reminder as we start." }]} /></Section>
      <Section><Head label="After the class" title="Missed it? You are covered" lead="Everyone who registered gets the replay for 48 hours, and the date of the next class." /></Section>
      <CtaBand title="Reserve a free seat" primary={["Get the free resource", "/free-resource"]} secondary={["Apply", "/apply"]} />
    </>
  );
}
