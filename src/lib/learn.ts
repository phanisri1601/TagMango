import "server-only";
import crypto from "crypto";
import { store } from "./db";

type Row = Record<string, unknown> & { id: string; userId: string };

/**
 * Courses this person has bought: a successful, unexpired purchase (or a manually added customer) of a mango
 * that the creator linked to a published course. Blocked people lose access. Matching is by email.
 */
export async function entitledCourses(email: string): Promise<Row[]> {
  const e = email.trim().toLowerCase();
  const [sales, manual, blocked] = await Promise.all([
    store.find("sales", [["email", e]]),
    store.find("customers", [["email", e]]),
    store.find("blocked", [["email", e]]),
  ]);
  const t = Date.now();
  const live = (r: Record<string, unknown>) => !(r.expires && new Date(String(r.expires)).getTime() < t);
  const block = new Set(blocked.map((b) => String(b.userId)));
  const owned = new Map<string, Set<string>>(); // creator id -> mango titles
  const add = (creator: string, mango: string) => { if (!block.has(creator)) (owned.get(creator) || owned.set(creator, new Set()).get(creator)!).add(mango); };
  for (const s of sales) if (s.status === "Success" && live(s)) add(String(s.userId), String(s.mango));
  for (const m of manual) if (!m.revoked && live(m)) add(String(m.userId), String(m.mango));

  const out: Row[] = [];
  for (const [creator, titles] of owned) {
    for (const c of (await store.find("courses", [["userId", creator]])) as unknown as Row[]) {
      if (c.published && ((c.mangoes as string[]) || []).some((m) => titles.has(m))) out.push(c);
    }
  }
  return out;
}

export async function entitledCourse(email: string, courseId: string) {
  return (await entitledCourses(email)).find((c) => c.id === courseId) || null;
}

/** One progress record per learner and course. The creator's id is on it so it is deleted with the creator. */
export const progressId = (courseId: string, email: string) => crypto.createHash("sha256").update(`${courseId}|${email.toLowerCase()}`).digest("hex").slice(0, 20);

export const chapterIds = (course: Row) => (((course.sections as { chapters?: { id: string }[] }[]) || []).flatMap((s) => (s.chapters || []).map((c) => c.id)));
