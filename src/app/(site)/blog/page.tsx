import Link from "next/link";
import { H1, Label, Section, serif } from "@/components/site/ui";
import { siteData, sitePosts } from "@/lib/site/data";

import { CtaBand } from "@/components/site/blocks";

export const metadata = { title: "Blog" };

export default async function Blog() {
  const { g } = await siteData();
  const { posts, sample } = await sitePosts(g?.userId);
  return (
    <>
    <Section>
      <Label>Resources</Label>
      <H1 className="mt-4">Blog</H1>
      {sample && <p className="mt-4 text-[13px] text-[#5c5a55]">Sample articles. Add your own under Website › Blog posts in the dashboard and these are replaced.</p>}
      <ul className="mt-10 divide-y divide-[#e9e6e0] border-y border-[#e9e6e0]">
        {posts.map((p) => (
          <li key={p.slug} className="py-6">
            <p className="text-[12px] uppercase tracking-[0.22em] text-[#5c5a55]">{new Date(p.date).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>
            <Link href={`/blog/${p.slug}`} className="mt-1 block text-[32px] leading-tight hover:underline" style={serif}>{p.title}</Link>
            <p className="mt-1 max-w-2xl text-[16px] font-light text-[#5c5a55]">{p.excerpt}</p>
          </li>
        ))}
      </ul>
    </Section>
      <CtaBand title="Want to name your own pattern?" text="Get the free guide and take the five-minute Pattern Check." primary={["Get the free resource", "/free-resource"]} secondary={["Apply", "/apply"]} />
    </>
  );
}
