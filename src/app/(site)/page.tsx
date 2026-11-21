import Link from "next/link";
import { Button, Card, H1, H2, Label, Rule, Section, serif, wrap } from "@/components/site/ui";
import { siteData, sitePosts, siteStories } from "@/lib/site/data";
import { METHOD_STEPS } from "@/lib/site/content";

export const metadata = { title: "Home" };

export default async function Home() {
  const { g, mango } = await siteData();
  const coach = g?.coachName || "Nitienaa Rao";
  const programme = g?.programme || "THE HUMAN OS™";
  const stories = g ? (await siteStories(g.userId)).slice(0, 2) : [];
  const { posts } = await sitePosts(g?.userId);
  return (
    <>
      <section className={`${wrap} pb-14 pt-16 sm:pb-24 sm:pt-28`}>
        <Label>{programme}</Label>
        <H1 className="mt-5 max-w-3xl">{g?.tagline || "See the pattern that runs your choices. Then change it."}</H1>
        <p className="mt-6 max-w-xl text-[18px] font-light leading-relaxed text-[#4a4843]">
          {coach} helps people name the habits of mind that repeat in work, family and money, and build a calmer way to respond.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          {g ? <Button href={`/q/${g.slug}`}>Take the Pattern Check</Button> : null}
          <Button href="/apply" variant="outline">Apply for {programme}</Button>
        </div>
      </section>

      <Rule />
      <Section>
        <Label>How it works</Label>
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {[["1", "Spot your pattern", "A five-minute check names the pattern you keep repeating.", g ? `/q/${g.slug}` : "/free-resource", "Take the check"],
            ["2", "Join the free masterclass", "A live session that shows how a pattern works and how it changes.", "/events", "See dates"],
            ["3", "Talk it through, then enrol", "A short conversation to see if the programme fits.", "/apply", "Apply"]].map(([n, t, d, h, c]) => (
            <Card key={n} strong>
              <p className="text-[40px] leading-none text-[#8a867d]" style={serif}>{n}</p>
              <h3 className="mt-3 text-[26px] leading-tight" style={serif}>{t}</h3>
              <p className="mt-2 text-[15px] font-light leading-relaxed text-[#4a4843]">{d}</p>
              <Link href={h} className="mt-4 inline-block text-[14px] underline underline-offset-4">{c}</Link>
            </Card>
          ))}
        </div>
      </Section>

      <Rule />
      <Section className="grid gap-10 sm:grid-cols-[1fr_1.3fr]">
        <div>
          <Label>The programme</Label>
          <H2 className="mt-3">{mango ? String(mango.title) : programme}</H2>
          <div className="mt-6"><Button href="/programme">About the programme</Button></div>
        </div>
        <ol className="space-y-4">
          {METHOD_STEPS.map((s) => (
            <li key={s.n} className="flex gap-5 border-b border-[#d6d2c9] pb-4">
              <span className="text-[26px] text-[#8a867d]" style={serif}>{s.n}</span>
              <div><p className="text-[22px]" style={serif}>{s.t}</p><p className="text-[15px] font-light text-[#4a4843]">{s.d}</p></div>
            </li>
          ))}
        </ol>
      </Section>

      {stories.length > 0 && (
        <>
          <Rule />
          <Section>
            <Label>Stories and proof</Label>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {stories.map((t) => (
                <figure key={String(t.id)} className="border border-[#d6d2c9] bg-[#faf9f6] p-6">
                  <blockquote className="text-[22px] leading-snug" style={serif}>{((t.answers as string[]) || []).filter(Boolean)[0]}</blockquote>
                  <figcaption className="mt-3 text-[14px] text-[#6f6c66]">{String(t.name)}</figcaption>
                </figure>
              ))}
            </div>
            <Link href="/stories" className="mt-6 inline-block text-[14px] underline underline-offset-4">More stories</Link>
          </Section>
        </>
      )}

      <Rule />
      <Section className="grid gap-8 sm:grid-cols-2">
        <Card strong>
          <Label>Free resource</Label>
          <h3 className="mt-3 text-[30px] leading-tight" style={serif}>A short guide to noticing your pattern</h3>
          <p className="mt-2 text-[15px] font-light text-[#4a4843]">One email, no spam. Ask for it and it arrives at once.</p>
          <div className="mt-5"><Button href="/free-resource">Get the free resource</Button></div>
        </Card>
        <div>
          <Label>From the blog</Label>
          <ul className="mt-4 space-y-4">
            {posts.slice(0, 3).map((p) => (
              <li key={p.slug} className="border-b border-[#d6d2c9] pb-4"><Link href={`/blog/${p.slug}`} className="text-[24px] leading-snug hover:underline" style={serif}>{p.title}</Link><p className="text-[14px] font-light text-[#6f6c66]">{p.excerpt}</p></li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
