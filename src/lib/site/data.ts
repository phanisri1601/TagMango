import "server-only";
import { store } from "../db";
import { getGrowth, growthBySlug, type Growth } from "../growth/core";
import { findMango } from "../public";
import { BLOG_SAMPLES, type Post } from "./content";

/** The creator whose website this is: SITE_SLUG, else the first one with a programme mango set. */
export async function siteGrowth(): Promise<Growth | null> {
  const slug = process.env.SITE_SLUG;
  if (slug) return growthBySlug(slug);
  const all = (await store.find("growth")) as unknown as Growth[];
  return all.find((g) => g.programmeMango) || all[0] || null;
}

export async function siteData() {
  const g = await siteGrowth();
  const mango = g?.programmeMango ? await findMango(g.programmeMango) : null;
  return { g, mango: mango?.mango || null };
}

export async function sitePosts(userId?: string): Promise<{ posts: Post[]; sample: boolean }> {
  const rows = userId ? (await store.find("blogPosts", [["userId", userId]])).filter((p) => p.published !== false) : [];
  if (!rows.length) return { posts: BLOG_SAMPLES, sample: true };
  return {
    sample: false,
    posts: rows.sort((a, b) => String(b.date || b.createdAt).localeCompare(String(a.date || a.createdAt))).map((p) => ({
      slug: String(p.slug), title: String(p.title), excerpt: String(p.excerpt || ""), body: String(p.body || ""), date: String(p.date || p.createdAt).slice(0, 10), image: p.image ? String(p.image) : undefined,
    })),
  };
}

export async function siteStories(userId: string) {
  return (await store.find("testimonials", [["userId", userId]])).filter((t) => t.status === "approved" && t.permission === true).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export async function siteMasterclasses(userId: string) {
  const all = await store.find("masterclasses", [["userId", userId]]);
  return all.filter((m) => m.published !== false && new Date(String(m.startsAt)).getTime() + Number(m.duration || 120) * 60000 > Date.now()).sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)));
}

export const siteOwner = async (userId: string) => getGrowth(userId);
