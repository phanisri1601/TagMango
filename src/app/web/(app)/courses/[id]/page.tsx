"use client";
import Link from "next/link";
import { use } from "react";
import { useCollection } from "@/lib/client";
import { Panel } from "@/components/dash/kit";
import CoursePlayerView from "@/components/CoursePlayerView";

/** The creator's own preview of a course. Buyers use /learn/[id]. Progress here stays in this browser only. */
export default function CoursePreview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const col = useCollection("courses");
  const course = col.rows.find((c) => c.id === id);
  if (col.loading) return <div className="mx-auto h-64 max-w-6xl animate-pulse rounded-[10px] bg-white" />;
  if (!course) return <Panel className="mx-auto max-w-xl p-8 text-center">Course not found. <Link href="/web/courses" className="text-[#141413] underline">Back</Link></Panel>;
  return <CoursePlayerView course={{ id: course.id, title: String(course.title), published: Boolean(course.published), sections: course.sections }} backHref="/web/courses" />;
}
