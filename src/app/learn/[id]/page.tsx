"use client";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import CoursePlayerView, { type PlayerCourse } from "@/components/CoursePlayerView";

/** A bought course. Progress is saved to the account, so it follows the learner to any device. */
export default function LearnCourse({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [d, setD] = useState<{ course: PlayerCourse; done: string[]; creator: string } | null>(null);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch(`/api/learn?course=${encodeURIComponent(id)}`).then(async (r) => {
      if (r.status === 401) { window.location.href = `/login?afterLoginRedirectTo=/learn/${id}`; return; }
      const j = await r.json();
      if (!r.ok) return setErr(j.error || "Something went wrong");
      setD(j);
    }).catch(() => setErr("Network error. Please refresh."));
  }, [id]);
  const save = useCallback((chapterId: string, done: boolean) => {
    fetch("/api/learn", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ courseId: id, chapterId, done }) }).catch(() => {});
  }, [id]);

  if (err) return <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center"><p className="text-[18px] font-semibold">This course isn&apos;t available</p><p className="mt-2 text-[14px] text-[#5c5a55]">{err}</p><Link href="/learn" className="mt-4 inline-block text-[14px] underline">Back to my courses</Link></div>;
  if (!d) return <div className="h-72 animate-pulse rounded-xl bg-white" />;
  return <CoursePlayerView course={d.course} backHref="/learn" backLabel="Back to my courses" serverDone={d.done} onSave={save} byline={d.creator} />;
}
