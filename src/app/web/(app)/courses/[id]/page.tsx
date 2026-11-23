"use client";
import Link from "next/link";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCollection } from "@/lib/client";
import { Panel } from "@/components/dash/kit";
import { Icon } from "@/components/dash/icons";

type Chapter = { id: string; title: string; type: string; url?: string; text?: string; free?: boolean };
type Section = { id: string; title: string; chapters: Chapter[] };

function embed(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return { kind: "youtube" as const, src: `https://www.youtube-nocookie.com/embed/${yt[1]}?enablejsapi=1&rel=0&modestbranding=1` };
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return { kind: "vimeo" as const, src: `https://player.vimeo.com/video/${vm[1]}?api=1` };
  return null;
}

const TYPE_LABEL: Record<string, string> = { Video: "Video", Audio: "Audio", PDF: "Reading", Text: "Reading", Assignment: "Assignment" };
const store = (k: string, v?: unknown) => {
  try {
    if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null");
    localStorage.setItem(k, JSON.stringify(v));
  } catch { /* private mode: progress just is not remembered */ }
  return null;
};

/**
 * Learner view of a course: lesson by lesson, with automatic completion when a video ends, an "Up next" countdown,
 * previous/next navigation, module progress and a resume point. Progress is remembered in this browser.
 */
export default function CoursePlayer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const col = useCollection("courses");
  const course = col.rows.find((c) => c.id === id);
  const sections = useMemo(() => ((course?.sections as Section[]) || []).filter((s) => s.chapters.length), [course]);
  const all = useMemo(() => sections.flatMap((s) => s.chapters), [sections]);
  const [cur, setCur] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);
  const [auto, setAuto] = useState(true);
  const [upNext, setUpNext] = useState<{ id: string; left: number } | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [startPlaying, setStartPlaying] = useState(false);
  const [moduleDone, setModuleDone] = useState<string | null>(null);
  const loaded = useRef(false);

  // restore progress, then land on the first lesson that is not finished
  useEffect(() => {
    if (loaded.current || !all.length) return;
    loaded.current = true;
    const d = (store(`tm:progress:${id}`) as string[] | null) || [];
    setDone(d);
    setAuto(store("tm:autoplay") !== false);
    const resume = store(`tm:last:${id}`) as string | null;
    setCur(all.find((c) => c.id === resume)?.id || all.find((c) => !d.includes(c.id))?.id || all[0].id);
  }, [all, id]);

  const idx = all.findIndex((c) => c.id === cur);
  const ch = all[idx];
  const sec = sections.find((s) => s.chapters.some((c) => c.id === cur));
  useEffect(() => { if (sec) setOpen((o) => ({ ...o, [sec.id]: true })); }, [sec]);
  useEffect(() => { if (cur) store(`tm:last:${id}`, cur); }, [cur, id]);

  const isDone = useCallback((cid: string) => done.includes(cid), [done]);
  const secDone = (s: Section) => s.chapters.filter((c) => isDone(c.id)).length;

  const go = useCallback((cid: string | null, play = false) => {
    setUpNext(null); setModuleDone(null); setStartPlaying(play);
    if (cid) setCur(cid);
  }, []);

  const complete = useCallback((cid: string, advance = false) => {
    setDone((d) => {
      if (d.includes(cid)) return d;
      const n = [...d, cid];
      store(`tm:progress:${id}`, n);
      return n;
    });
    if (!advance) return;
    const i = all.findIndex((c) => c.id === cid);
    const next = all[i + 1];
    const s = sections.find((x) => x.chapters.some((c) => c.id === cid));
    const lastInSection = s && s.chapters[s.chapters.length - 1].id === cid;
    if (lastInSection && s) setModuleDone(s.title);
    if (next) setUpNext({ id: next.id, left: auto ? 5 : 0 });
  }, [all, sections, auto, id]);

  const uncomplete = (cid: string) => setDone((d) => { const n = d.filter((x) => x !== cid); store(`tm:progress:${id}`, n); return n; });

  // "Up next" countdown
  useEffect(() => {
    if (!upNext || upNext.left <= 0 || !auto) return;
    const t = setTimeout(() => {
      if (upNext.left <= 1) go(upNext.id, true);
      else setUpNext({ ...upNext, left: upNext.left - 1 });
    }, 1000);
    return () => clearTimeout(t);
  }, [upNext, auto, go]);

  if (col.loading) return <div className="mx-auto h-64 max-w-6xl animate-pulse rounded-[10px] bg-white" />;
  if (!course) return <Panel className="mx-auto max-w-xl p-8 text-center">Course not found. <Link href="/web/courses" className="text-[#141413] underline">Back</Link></Panel>;

  const total = all.length;
  const doneCount = all.filter((c) => isDone(c.id)).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const finished = total > 0 && doneCount === total;
  const next = all[idx + 1];
  const prev = all[idx - 1];

  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1fr_340px]">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/web/courses" className="grid h-9 w-9 place-items-center rounded-md border border-[#e1e1e1] bg-white" aria-label="Back"><Icon name="chevron" className="h-4 w-4 rotate-90" /></Link>
          <div className="min-w-0"><h1 className="truncate text-[20px] font-semibold">{String(course.title)}</h1><p className="text-[12px] text-[#5c5a55]">{total} lessons · {sections.length} modules</p></div>
          {!course.published && <span className="rounded bg-[#e9e6e0] px-2 text-[12px]">Draft preview</span>}
        </div>

        <Panel className="overflow-hidden">
          {!ch ? <p className="p-10 text-center text-[14px] text-[#5c5a55]">This course has no chapters yet.</p> : (
            <>
              <div className="relative">
                <Stage key={ch.id} ch={ch} autoPlay={startPlaying} courseId={id} onEnded={() => complete(ch.id, true)} />
                {upNext && next && upNext.id === next.id && (
                  <div className="absolute inset-0 grid place-items-center bg-[#141413]/90 p-6 text-center text-white backdrop-blur-sm">
                    <div className="max-w-sm">
                      {moduleDone && <p className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[12px]">✓ Module complete: {moduleDone}</p>}
                      <p className="text-[12px] uppercase tracking-widest text-white/60">Up next · {TYPE_LABEL[next.type] || next.type}</p>
                      <p className="mt-1 text-[22px] font-semibold leading-tight">{next.title}</p>
                      <div className="mt-5 flex justify-center gap-2">
                        <button onClick={() => go(next.id, true)} className="rounded-md bg-[#f4f2ed] px-5 py-2.5 text-[14px] font-semibold text-[#141413]">{auto && upNext.left > 0 ? `Play now (${upNext.left})` : "Continue"}</button>
                        <button onClick={() => setUpNext(null)} className="rounded-md border border-white/30 px-5 py-2.5 text-[14px]">Stay here</button>
                      </div>
                    </div>
                  </div>
                )}
                {upNext && !next && null}
              </div>

              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] uppercase tracking-wide text-[#5c5a55]">{sec?.title} · Lesson {idx + 1} of {total} · {TYPE_LABEL[ch.type] || ch.type}</p>
                    <p className="mt-0.5 text-[20px] font-semibold">{ch.title}</p>
                  </div>
                  <button onClick={() => (isDone(ch.id) ? uncomplete(ch.id) : complete(ch.id, true))} className={`flex items-center gap-2 rounded-md border px-4 py-2 text-[14px] font-medium transition ${isDone(ch.id) ? "border-[#141413] bg-[#141413] text-white" : "border-[#141413] hover:bg-[#141413] hover:text-white"}`}>
                    <Icon name="check" className="h-4 w-4" />{isDone(ch.id) ? "Completed" : ch.type === "Video" || ch.type === "Audio" ? "Mark as complete" : "Mark complete and continue"}
                  </button>
                </div>
                {ch.text && <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-[#3f3e3a]">{ch.text}</p>}
                <div className="flex items-center justify-between border-t border-[#ededed] pt-4">
                  <button disabled={!prev} onClick={() => prev && go(prev.id)} className="rounded-md border border-[#e1e1e1] px-4 py-2 text-[14px] disabled:opacity-40">← Previous</button>
                  <label className="flex cursor-pointer items-center gap-2 text-[13px] text-[#5c5a55]"><input type="checkbox" checked={auto} onChange={(e) => { setAuto(e.target.checked); store("tm:autoplay", e.target.checked); }} className="accent-[#141413]" />Autoplay next lesson</label>
                  <button disabled={!next} onClick={() => next && go(next.id)} className="rounded-md bg-[#141413] px-4 py-2 text-[14px] font-medium text-white disabled:opacity-40">Next →</button>
                </div>
              </div>
            </>
          )}
        </Panel>

        {finished && (
          <Panel className="p-6 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#141413] text-[22px] text-white">✓</span>
            <p className="mt-3 text-[20px] font-semibold">You completed this course</p>
            <p className="mt-1 text-[14px] text-[#5c5a55]">All {total} lessons are done. Well done.</p>
            <button onClick={() => go(all[0].id)} className="mt-4 rounded-md border border-[#141413] px-5 py-2 text-[14px] font-medium hover:bg-[#141413] hover:text-white">Review from the start</button>
          </Panel>
        )}
      </div>

      <Panel className="h-fit p-4 lg:sticky lg:top-4">
        <div className="flex items-center justify-between"><p className="text-[14px] font-semibold">Course content</p><p className="text-[12px] text-[#5c5a55]">{doneCount}/{total} done</p></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e9e6e0]"><div className="h-full rounded-full bg-[#141413] transition-all duration-500" style={{ width: `${pct}%` }} /></div>
        <p className="mt-1 text-[12px] text-[#5c5a55]">{pct}% complete</p>
        {!finished && total > 0 && (
          <button onClick={() => go(all.find((c) => !isDone(c.id))?.id || all[0].id)} className="mt-3 w-full rounded-md bg-[#141413] py-2 text-[13px] font-medium text-white">{doneCount ? "Continue learning" : "Start the course"}</button>
        )}
        <div className="mt-4 space-y-2">
          {sections.map((s, si) => {
            const n = secDone(s);
            const complete = n === s.chapters.length;
            const expanded = open[s.id] ?? false;
            return (
              <div key={s.id} className="overflow-hidden rounded-lg border border-[#ededed]">
                <button onClick={() => setOpen((o) => ({ ...o, [s.id]: !expanded }))} className="flex w-full items-center gap-2 bg-[#f4f2ed] px-3 py-2.5 text-left">
                  <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${complete ? "bg-[#141413] text-white" : "border border-[#5c5a55] text-[#5c5a55]"}`}>{complete ? "✓" : si + 1}</span>
                  <span className="min-w-0 flex-1"><b className="block truncate text-[13px]">{s.title}</b><span className="text-[11px] text-[#5c5a55]">{n}/{s.chapters.length} lessons</span></span>
                  <Icon name="chevron" className={`h-4 w-4 transition-transform ${expanded ? "" : "-rotate-90"}`} />
                </button>
                {expanded && s.chapters.map((c) => (
                  <button key={c.id} onClick={() => go(c.id)} className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-[13px] transition ${cur === c.id ? "bg-[#e9e6e0]" : "hover:bg-[#f7f7f7]"}`}>
                    <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] ${isDone(c.id) ? "bg-[#141413] text-white" : cur === c.id ? "border-2 border-[#141413]" : "border border-[#bfbfbf]"}`}>{isDone(c.id) ? "✓" : ""}</span>
                    <span className="min-w-0 flex-1 truncate">{c.title}</span>
                    <span className="shrink-0 text-[11px] text-[#5c5a55]">{TYPE_LABEL[c.type] || c.type}</span>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

/** The lesson content. Video and audio report when they finish; embeds are watched through the player's own messages. */
function Stage({ ch, autoPlay, courseId, onEnded }: { ch: Chapter; autoPlay: boolean; courseId: string; onEnded: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const media = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const fired = useRef(false);
  const em = ch.url ? embed(ch.url) : null;
  const end = useCallback(() => { if (!fired.current) { fired.current = true; onEnded(); } }, [onEnded]);
  const key = `tm:pos:${courseId}:${ch.id}`;

  // YouTube and Vimeo tell us when the video finishes by posting a message
  useEffect(() => {
    if (!em) return;
    const onMsg = (e: MessageEvent) => {
      if (e.source !== frame.current?.contentWindow) return;
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (em.kind === "youtube" && d?.event === "onStateChange" && d.info === 0) end();
        if (em.kind === "vimeo" && d?.event === "finish") end();
      } catch { /* not a player message */ }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [em, end]);
  const subscribe = () => {
    const w = frame.current?.contentWindow;
    if (!w || !em) return;
    if (em.kind === "youtube") w.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
    else w.postMessage(JSON.stringify({ method: "addEventListener", value: "finish" }), "*");
  };

  // remember where a video was, and finish at 95%
  const onTime = () => {
    const m = media.current;
    if (!m || !m.duration) return;
    if (Math.floor(m.currentTime) % 5 === 0) store(key, m.currentTime);
    if (m.currentTime / m.duration >= 0.95) end();
  };
  const onLoaded = () => {
    const m = media.current;
    const at = store(key) as number | null;
    if (m && at && m.duration && at < m.duration - 5) m.currentTime = at;
  };

  const box = "grid aspect-video place-items-center bg-black text-white";
  if (em) return <div className={box}><iframe ref={frame} onLoad={subscribe} src={em.src} title={ch.title} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>;
  if (ch.type === "Video" && ch.url) return <div className={box}><video ref={media as React.RefObject<HTMLVideoElement>} src={ch.url} controls autoPlay={autoPlay} playsInline onEnded={end} onTimeUpdate={onTime} onLoadedMetadata={onLoaded} className="h-full w-full bg-black" /></div>;
  if (ch.type === "Audio" && ch.url) return <div className="grid place-items-center bg-[#141413] px-6 py-12"><audio ref={media as React.RefObject<HTMLAudioElement>} src={ch.url} controls autoPlay={autoPlay} onEnded={end} onTimeUpdate={onTime} onLoadedMetadata={onLoaded} className="w-full max-w-xl" /></div>;
  if (ch.type === "PDF" && ch.url) return (
    <div className="bg-[#f4f2ed]">
      <iframe src={ch.url} title={ch.title} className="h-[520px] w-full bg-white" />
      <div className="flex justify-end border-t border-[#e9e6e0] px-4 py-2"><a href={ch.url} target="_blank" rel="noreferrer" className="text-[13px] underline">Open in a new tab</a></div>
    </div>
  );
  if (ch.url) return <div className={box}><a href={ch.url} target="_blank" rel="noreferrer" className="rounded-md bg-white px-4 py-2 text-[#141413]">Open {ch.type}</a></div>;
  return <div className="grid min-h-[220px] place-items-center bg-[#f4f2ed] px-6 py-10 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#141413] text-white"><Icon name={ch.type === "Assignment" ? "check" : "courses"} className="h-6 w-6" /></span><p className="mt-3 text-[16px] font-medium">{TYPE_LABEL[ch.type] || ch.type}</p><p className="mt-1 text-[13px] text-[#5c5a55]">Read the notes below, then mark this lesson complete.</p></div></div>;
}
