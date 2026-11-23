import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteRender, { type Block, type SiteTheme } from "@/components/dash/SiteRender";
import TrackView from "@/components/TrackView";
import { findSite } from "@/lib/public";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await findSite(slug);
  if (!site) return {};
  const seo = (site.seo || {}) as { title?: string; description?: string };
  return { title: seo.title || String(site.name), description: seo.description || undefined };
}

export default async function Site({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await findSite(slug);
  if (!site) notFound();
  return (
    <>
      <TrackView kind="site" refId={site.id} />
      <SiteRender blocks={(site.blocks as Block[]) || []} color={String(site.color || "#141413")} name={String(site.name)} theme={site.theme as SiteTheme | undefined} />
    </>
  );
}
