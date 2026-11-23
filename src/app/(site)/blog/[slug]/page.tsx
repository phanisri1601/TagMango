import { notFound } from "next/navigation";
import Link from "next/link";
import { Button, H1, Label, Rule, Section, wrap } from "@/components/site/ui";
import { siteData, sitePosts } from "@/lib/site/data";

/** One template for every article. */
export default async function Article({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { g } = await siteData();
  const { posts } = await sitePosts(g?.userId);
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  return (
    <>
      <article className={`${wrap} max-w-[760px] py-14 sm:py-20`}>
        <Label>Article · {new Date(post.date).toLocaleDateString("en-IN", { dateStyle: "long" })}</Label>
        <H1 className="mt-4 !text-[40px] sm:!text-[54px]">{post.title}</H1>
        {post.image ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={post.image} alt="" className="mt-8 w-full" /> : null}
        <div className="mt-8 space-y-5 text-[18px] font-light leading-[1.75] text-[#141413]">
          {post.body.split(/\n{2,}/).map((para, i) => <p key={i} className="whitespace-pre-wrap">{para}</p>)}
        </div>
        <Link href="/blog" className="mt-10 inline-block text-[14px] underline underline-offset-4">All articles</Link>
      </article>
      <Rule />
      <Section className="text-center"><p className="text-[22px]" style={{ fontFamily: "var(--font-vietnam)" }}>Want to name your own pattern?</p><div className="mt-5"><Button href="/free-resource">Get the free resource</Button></div></Section>
    </>
  );
}
