"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Sub = { text?: string; link?: string; feedback?: string } | null;
type P = {
  enrolled: boolean; name?: string; coach: string; programme: string; kickoff: string; boundaryLine: string; referralLine: string; quizLink: string; progress: number; completed: boolean; certificatePending?: boolean;
  enrolment: { name: string; lessonsDone: string[]; attended: string[]; missed: string[] };
  lessons: { id: string; week: number; title: string; body?: string; videoUrl?: string; fileUrl?: string }[];
  classes: { id: string; week?: number; title: string; startsAt: string; joinLink?: string; recordingUrl?: string; attended: boolean }[];
  assignments: { id: string; week: number; title: string; brief?: string; dueAt?: string; submission: Sub }[];
  updates: { id: string; title: string; body: string; createdAt: string }[];
};

const card = "rounded-xl border border-[#e6e6e0] bg-white p-4";
const input = "w-full rounded-lg border border-[#d8d8d8] px-3 py-2 text-[14px] outline-none focus:border-[#222]";

function Submit({ a, onDone }: { a: P["assignments"][number]; onDone: () => void }) {
  const [text, setText] = useState(a.submission?.text || "");
  const [link, setLink] = useState(a.submission?.link || "");
  const [msg, setMsg] = useState("");
  const locked = !!a.submission?.feedback;
  return (
    <div className="mt-2 space-y-2">
      <textarea className={`${input} min-h-24`} placeholder="Your answer" value={text} disabled={locked} onChange={(e) => setText(e.target.value)} />
      <input className={input} placeholder="Link to a file (Drive, Dropbox…), optional" value={link} disabled={locked} onChange={(e) => setLink(e.target.value)} />
      {!locked && <button className="rounded-lg bg-[#111] px-4 py-2 text-[14px] text-white" onClick={async () => { const r = await fetch("/api/portal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "submit", assignmentId: a.id, text, link }) }).then((x) => x.json()); if (r.error) setMsg(r.error); else { setMsg("Submitted"); onDone(); } }}>{a.submission ? "Update submission" : "Submit"}</button>}
      {msg && <p className="text-[13px] text-[#555]">{msg}</p>}
      {a.submission?.feedback && <div className="rounded-lg bg-[#f4f2ed] p-3 text-[14px]"><p className="text-[12px] font-medium uppercase tracking-wide text-[#888]">Feedback</p><p className="whitespace-pre-wrap">{a.submission.feedback}</p></div>}
    </div>
  );
}

export default function Portal() {
  const [p, setP] = useState<P | null>(null);
  const [err, setErr] = useState("");
  const load = useCallback(async () => {
    const r = await fetch("/api/portal");
    if (r.status === 401) { window.location.href = "/login?afterLoginRedirectTo=/portal"; return; }
    setP(await r.json());
  }, []);
  useEffect(() => { load().catch((e) => setErr(e.message)); }, [load]);
  const act = async (body: unknown) => { await fetch("/api/portal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }); load(); };

  if (err) return <p className="p-10 text-center">{err}</p>;
  if (!p) return <div className="grid min-h-screen place-items-center bg-[#fafaf8]"><div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#ddd] border-t-[#111]" /></div>;
  if (!p.enrolled) return (
    <div className="grid min-h-screen place-items-center bg-[#fafaf8] px-4 text-center"><div><h1 className="text-[24px] font-semibold">You&apos;re not enrolled yet</h1><p className="mt-2 text-[#555]">Sign in with the email you enrolled with, or enrol first.</p><button className="mt-4 text-[14px] underline" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login?afterLoginRedirectTo=/portal"; }}>Use a different email</button></div></div>
  );
  const weeks = [...new Set([...p.lessons.map((l) => l.week), ...p.assignments.map((a) => a.week), ...p.classes.map((c) => c.week || 0)])].filter((w) => w > 0).sort((a, b) => a - b);
  const done = new Set(p.enrolment.lessonsDone);

  return (
    <div className="min-h-screen bg-[#fafaf8] text-[#171717]" style={{ fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif" }}>
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8">
        <header className="flex items-start justify-between gap-3">
          <div><p className="text-[12px] uppercase tracking-[0.2em] text-[#888]">{p.coach}</p><h1 className="text-[26px] font-semibold">{p.programme}</h1><p className="text-[14px] text-[#555]">Welcome, {p.enrolment.name.split(" ")[0]}.{p.kickoff ? ` Kick-off: ${p.kickoff}.` : ""}</p></div>
          <button className="text-[13px] underline" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; }}>Sign out</button>
        </header>

        <section className={card}>
          <div className="flex justify-between text-[14px]"><b>Your progress</b><b>{p.progress}%</b></div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#eee]"><div className="h-full rounded-full bg-[#111] transition-all" style={{ width: `${p.progress}%` }} /></div>
          {p.completed && <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-[#f4f2ed] p-3 text-[14px]"><span>You have completed the programme.</span>{p.certificatePending ? <span className="font-medium">Your certificate is waiting for your coach&apos;s approval. You will get an email when it is issued.</span> : <Link className="underline" href="/portal/certificate">View certificate</Link>}{p.quizLink && <Link className="underline" href={p.quizLink}>Retake the Pattern Check</Link>}</div>}
        </section>

        {p.updates.length > 0 && <section className={card}><h2 className="text-[16px] font-semibold">Announcements</h2><div className="mt-2 space-y-3">{p.updates.slice(0, 3).map((u) => <div key={u.id}><p className="font-medium">{u.title}</p><p className="whitespace-pre-wrap text-[14px] text-[#555]">{u.body}</p></div>)}</div></section>}

        {weeks.map((w) => (
          <section key={w} className={card}>
            <h2 className="text-[17px] font-semibold">Week {w}</h2>
            <div className="mt-3 space-y-3">
              {p.classes.filter((c) => c.week === w).map((c) => (
                <div key={c.id} className="rounded-lg border border-[#eee] p-3 text-[14px]"><p className="text-[12px] uppercase tracking-wide text-[#888]">Live class</p><p className="font-medium">{c.title}</p><p className="text-[#555]">{new Date(c.startsAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}{c.attended ? " · attended" : ""}</p><div className="mt-1 flex gap-3">{c.joinLink && <a className="underline" href={c.joinLink} target="_blank" rel="noreferrer">Join</a>}{c.recordingUrl && <a className="underline" href={c.recordingUrl} target="_blank" rel="noreferrer">Recording</a>}</div></div>
              ))}
              {p.lessons.filter((l) => l.week === w).map((l) => (
                <div key={l.id} className="rounded-lg border border-[#eee] p-3 text-[14px]">
                  <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-4 w-4" checked={done.has(l.id)} onChange={(e) => act({ action: "lesson", lessonId: l.id, done: e.target.checked })} /><span><span className="font-medium">{l.title}</span>{l.body && <span className="mt-1 block whitespace-pre-wrap text-[#555]">{l.body}</span>}</span></label>
                  <div className="ml-7 mt-1 flex gap-3">{l.videoUrl && <a className="underline" href={l.videoUrl} target="_blank" rel="noreferrer">Watch</a>}{l.fileUrl && <a className="underline" href={l.fileUrl} target="_blank" rel="noreferrer">Download</a>}</div>
                </div>
              ))}
              {p.assignments.filter((a) => a.week === w).map((a) => (
                <div key={a.id} className="rounded-lg border border-[#eee] p-3 text-[14px]">
                  <p className="text-[12px] uppercase tracking-wide text-[#888]">Assignment{a.dueAt ? ` · due ${new Date(a.dueAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : ""}</p>
                  <p className="font-medium">{a.title}</p>{a.brief && <p className="whitespace-pre-wrap text-[#555]">{a.brief}</p>}
                  {w >= 4 && (p.boundaryLine || p.referralLine) && <p className="mt-2 rounded bg-[#f4f2ed] p-2 text-[13px] text-[#555]">{[p.boundaryLine, p.referralLine].filter(Boolean).join(" ")}</p>}
                  <Submit a={a} onDone={load} />
                </div>
              ))}
            </div>
          </section>
        ))}
        {!weeks.length && <section className={card}><p className="text-[#555]">Your coach hasn&apos;t added the programme content yet.</p></section>}
      </div>
    </div>
  );
}
