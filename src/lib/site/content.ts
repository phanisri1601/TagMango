/**
 * Words for the public website. Pages read the coach's real name, programme name and price from the dashboard;
 * everything else here is draft copy for the coach to replace (the scope says copy is "drafted from your content and approved by you").
 */
export type Post = { slug: string; title: string; excerpt: string; body: string; date: string; image?: string };

export const BLOG_SAMPLES: Post[] = [
  { slug: "the-pattern-behind-the-pattern", date: "2026-10-12", title: "The pattern behind the pattern", excerpt: "Why the same situation keeps showing up, and what it has to do with you.",
    body: "Most of us believe we are reacting to the situation in front of us. Often we are replaying something older.\n\nA pattern is a way of responding that runs before you choose it. It is not a flaw and it is not who you are. It is a habit of attention, formed when it was useful.\n\nThe first move is not to fix it. It is to name it, clearly enough that you can see it start.\n\nThe free Pattern Check takes five minutes and gives you a name for yours." },
  { slug: "why-good-advice-does-not-stick", date: "2026-09-28", title: "Why good advice does not stick", excerpt: "You know what to do. You do the other thing. That gap has a cause.",
    body: "Advice speaks to the part of you that already agrees. The pattern lives somewhere else.\n\nWhen you know better and still act the old way, the missing piece is rarely information. It is the moment between the trigger and the response.\n\nThe work is to widen that moment, one small repeat at a time." },
  { slug: "three-small-signs-you-are-on-autopilot", date: "2026-09-10", title: "Three small signs you are on autopilot", excerpt: "A quick way to spot a pattern while it is happening.",
    body: "1. You say yes before you check the question.\n2. You rehearse a conversation more than you have it.\n3. A reply that is only lukewarm stays with you for days.\n\nNone of these is a problem alone. Together they point to a pattern worth naming." },
];

export const METHOD_STEPS = [
  { n: "01", t: "Notice", d: "Spot the situation where you keep reacting the same way. We begin with the Pattern Check, then a live masterclass." },
  { n: "02", t: "Name", d: "Give the pattern a plain name, see how strongly it runs, and see which other patterns travel with it." },
  { n: "03", t: "Map", d: "Trace when it starts, what it protects, and what it costs. Small, concrete, in your own words." },
  { n: "04", t: "Change", d: "Weekly practices and live classes build the gap between trigger and response, with feedback on your work." },
  { n: "05", t: "Hold", d: "Finish with a certificate, a retest to see how far you have moved, and a clear next step." },
];

export const PROGRAMME_WEEKS = ["Week 1 · See the pattern", "Week 2 · Trace where it starts", "Week 3 · What it protects", "Week 4 · The pause", "Week 5 · Practise with others", "Week 6 · Hold the change"];

export const PRESS_KIT = { line: "Nitienaa Rao is a coach who helps people see the patterns that run their choices, through THE HUMAN OS™ programme.", contact: "For interviews, podcasts or speaking, use the contact page." };
