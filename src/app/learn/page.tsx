"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Course = { id: string; title: string; creator: string; lessons: number; done: number; pct: number };
type Data = { name: string; programme: boolean; courses: Course[] };

/** The learner's home: every course they bought, with progress, and their programme if they are in one. */
export default function MyLearning() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/learn").then(async (r) => {
      if (r.status === 401) { window.location.href = "/login?afterLoginRedirectTo=/learn"; return; }
      const j = await r.json();
      if (!r.ok) return setErr(j.error || "Something went wrong");
      setD(j);
    }).catch(() => setErr("Network error. Please refresh."));
  }, []);

  if (err) return <p className="py-16 text-center text-[#5c5a55]">{err}</p>;
  if (!d) return <div className="space-y-4"><div className="h-10 w-64 animate-pulse rounded bg-white" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-44 animate-pulse rounded-xl bg-white" />)}</div></div>;
  const next = d.courses.find((c) => c.pct < 100);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-[34px] font-semibold leading-tight">Hello, {d.name.split(" ")[0]}</h1>
        <p className="mt-1 text-[#5c5a55]">{d.courses.length ? `You have ${d.courses.length} course${d.courses.length > 1 ? "s" : ""}.` : "Your courses will appear here after you buy one."}{next ? ` Pick up where you left off in "${next.title}".` : ""}</p>
      </div>

      {d.programme && (
        <Link href="/portal" className="flex flex-wrap items-center gap-4 rounded-xl border border-[#141413] bg-[#141413] p-5 text-white transition hover:opacity-95">
          <div className="min-w-0 flex-1"><p className="text-[12px] uppercase tracking-[0.18em] text-white/60">Your programme</p><p className="mt-1 text-[20px] font-semibold">Weekly lessons, live classes and assignments</p></div>
          <span className="rounded-md bg-white px-4 py-2 text-[14px] font-medium text-[#141413]">Open programme</span>
        </Link>
      )}

      {d.courses.length === 0 && !d.programme ? (
        <div className="rounded-xl border border-dashed border-[#bdb8ac] bg-white p-10 text-center">
          <p className="text-[18px] font-semibold">No courses yet</p>
          <p className="mx-auto mt-2 max-w-md text-[14px] text-[#5c5a55]">Courses show up here once you buy them. Make sure you are signed in with the email you paid with.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/programme" className="rounded-md bg-[#141413] px-5 py-2.5 text-[14px] font-medium text-white">See the programme</Link>
            <Link href="/enrol" className="rounded-md border border-[#141413] px-5 py-2.5 text-[14px] font-medium">Enrol now</Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {d.courses.map((c) => (
            <Link key={c.id} href={`/learn/${c.id}`} className="group flex flex-col rounded-xl border border-[#e6e3dc] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#141413] hover:shadow-md">
              <p className="text-[12px] uppercase tracking-wider text-[#5c5a55]">{c.creator || "Course"}</p>
              <p className="mt-1 flex-1 text-[18px] font-semibold leading-snug">{c.title}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#ede9e1]"><div className="h-full rounded-full bg-[#141413] transition-all" style={{ width: `${c.pct}%` }} /></div>
              <div className="mt-2 flex items-center justify-between text-[13px] text-[#5c5a55]"><span>{c.done} of {c.lessons} lessons</span><span className="font-medium text-[#141413] group-hover:underline">{c.pct === 100 ? "Review" : c.pct ? "Continue" : "Start"}</span></div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
