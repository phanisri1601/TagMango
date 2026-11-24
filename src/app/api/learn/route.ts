import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { now, store } from "@/lib/db";
import { chapterIds, entitledCourse, entitledCourses, progressId } from "@/lib/learn";

const bad = (m: string, status = 400) => NextResponse.json({ error: m }, { status });

/**
 * The buyer's side of courses.
 *   GET /api/learn            the courses this person bought, with progress, and whether they are in a programme
 *   GET /api/learn?course=ID  one course with its lessons and the lessons they have finished
 *   POST /api/learn           { courseId, chapterId, done } save progress
 */
export async function GET(req: Request) {
  const me = await currentUser();
  if (!me) return bad("Not logged in", 401);
  const email = me.email.toLowerCase();
  const courseId = new URL(req.url).searchParams.get("course");

  if (courseId) {
    const c = await entitledCourse(email, courseId);
    if (!c) return bad("You don't have access to this course. Buy it, or sign in with the email you bought it with.", 403);
    const [p] = await store.find("courseProgress", [["courseId", c.id], ["email", email]], { limit: 1 });
    const creator = await store.get("users", c.userId);
    return NextResponse.json({ course: { id: c.id, title: c.title, published: true, sections: c.sections || [] }, done: (p?.done as string[]) || [], creator: String(creator?.name || "") });
  }

  const courses = await entitledCourses(email);
  const progress = await store.find("courseProgress", [["email", email]]);
  const creators = new Map<string, string>();
  for (const c of courses) if (!creators.has(c.userId)) creators.set(c.userId, String((await store.get("users", c.userId))?.name || ""));
  const enrolments = await store.find("enrolments", [["email", email]]);
  return NextResponse.json({
    name: me.name,
    accountType: me.accountType || "creator",
    programme: enrolments.length > 0,
    courses: courses.map((c) => {
      const ids = chapterIds(c);
      const done = ((progress.find((p) => p.courseId === c.id)?.done as string[]) || []).filter((d) => ids.includes(d));
      return { id: c.id, title: String(c.title), creator: creators.get(c.userId) || "", lessons: ids.length, done: done.length, pct: ids.length ? Math.round((done.length / ids.length) * 100) : 0 };
    }),
  });
}

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return bad("Not logged in", 401);
  const b = await req.json().catch(() => ({}));
  const email = me.email.toLowerCase();
  const c = await entitledCourse(email, String(b.courseId || ""));
  if (!c) return bad("You don't have access to this course", 403);
  const ids = chapterIds(c);
  const chapter = String(b.chapterId || "");
  if (!ids.includes(chapter)) return bad("Lesson not found", 404);
  const [p] = await store.find("courseProgress", [["courseId", c.id], ["email", email]], { limit: 1 });
  const set = new Set(((p?.done as string[]) || []).filter((d) => ids.includes(d)));
  if (b.done) set.add(chapter); else set.delete(chapter);
  const done = [...set];
  const patch = { done, updatedAt: now(), completedAt: done.length === ids.length && ids.length ? (p?.completedAt || now()) : null };
  if (p) await store.write([{ type: "update", coll: "courseProgress", id: p.id, patch }]);
  else await store.write([{ type: "set", coll: "courseProgress", id: progressId(c.id, email), data: { userId: c.userId, createdAt: now(), courseId: c.id, email, ...patch } }]);
  return NextResponse.json({ ok: true, done, pct: ids.length ? Math.round((done.length / ids.length) * 100) : 0 });
}
