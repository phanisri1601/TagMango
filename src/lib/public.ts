import "server-only";
import { snapshot } from "./db";

/** Read-only lookups for public pages (no login). Only published/active data is exposed. */
export async function findPage(slug: string) {
  const db = await snapshot();
  const page = (db.rows.pages || []).find((p) => p.slug === slug && p.published);
  if (!page) return null;
  const mango = (db.rows.mangoes || []).find((m) => m.userId === page.userId && m.title === page.mango && m.active);
  const owner = db.users.find((u) => u.id === page.userId);
  if (owner?.suspended) return null;
  return { page, mango: mango || null, creator: owner ? { name: owner.name } : null };
}

export async function findStore(userId: string) {
  const db = await snapshot();
  const owner = db.users.find((u) => u.id === userId);
  if (!owner || owner.suspended) return null;
  const store = (owner.settings?.store || {}) as Record<string, unknown>;
  if (store.active === false) return { off: true as const, creator: { name: owner.name } };
  const hidden = new Set((store.hidden as string[]) || []);
  const mangoes = (db.rows.mangoes || []).filter((m) => m.userId === userId && m.active && !hidden.has(m.id));
  return { off: false as const, creator: { name: String(store.name || owner.name), tagline: String(store.tagline || owner.about?.category || ""), bio: String(store.bio || ""), avatar: String(store.avatar || ""), color: String(store.color || "#f2962c"), instagram: String(store.instagram || ""), youtube: String(store.youtube || "") }, mangoes };
}

export async function findMango(id: string) {
  const db = await snapshot();
  const mango = (db.rows.mangoes || []).find((m) => m.id === id && m.active);
  if (!mango) return null;
  const owner = db.users.find((u) => u.id === mango.userId);
  if (owner?.suspended) return null;
  return { mango, creator: owner ? { name: owner.name } : null };
}

export async function findEvent(id: string) {
  const db = await snapshot();
  const ev = (db.rows.events || []).find((e) => e.id === id && e.active !== false);
  if (!ev) return null;
  const owner = db.users.find((u) => u.id === ev.userId);
  if (owner?.suspended) return null;
  const overlap = Boolean(owner?.settings?.overlappingSlots);
  const taken = new Set((db.rows.bookings || []).filter((b) => b.userId === ev.userId && b.status !== "Cancelled").map((b) => String(b.slot)));
  const slots = ((ev.slots as string[]) || []).filter((s) => new Date(s).getTime() > Date.now() && (overlap || !taken.has(s))).sort();
  return { ev: { id: ev.id, title: String(ev.title), description: String(ev.description || ""), duration: Number(ev.duration || 30) }, slots, creator: owner ? { name: owner.name } : null };
}

export async function findSite(slug: string) {
  const db = await snapshot();
  const site = (db.rows.sites || []).find((s) => s.slug === slug && s.published);
  if (!site || db.users.find((u) => u.id === site.userId)?.suspended) return null;
  return site;
}
