"use client";
import { useCallback, useEffect, useState } from "react";
import { api, toast } from "@/lib/client";
import CaseView, { STATUS_TEXT, when, type CaseData } from "@/components/kyc/CaseView";

type Row = { userId: string; name: string; email: string; legalName: string; status: string; assignedAt?: string; reviewedAt?: string; recommendation?: string };
type List = { me: { name: string; email: string }; todo: Row[]; done: Row[] };

function Review({ id, onClose, onDone }: { id: string; onClose: () => void; onDone: () => void }) {
  const [c, setC] = useState<CaseData | null>(null);
  const [rec, setRec] = useState<"approve" | "corrections" | "">("");
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { api<{ case: CaseData }>(`/api/kyc/review?user=${id}`).then((r) => setC(r.case)).catch((e) => toast((e as Error).message, "err")); }, [id]);
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/45" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="flex h-full w-full max-w-[720px] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#ededed] px-5 py-3.5"><p className="text-[17px] font-semibold">{c ? c.legalName : "Case"}</p><button onClick={onClose} className="text-[22px] leading-none" aria-label="Close">×</button></div>
        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {!c ? <div className="h-40 animate-pulse rounded-lg bg-[#f4f2ed]" /> : <CaseView c={c} />}
          {c?.status === "assigned" && (
            <div className="space-y-3 rounded-lg border border-[#141413] p-4">
              <p className="text-[15px] font-semibold">Your recommendation</p>
              <label className={`flex cursor-pointer gap-3 rounded-md border p-3 ${rec === "approve" ? "border-[#141413] bg-[#f4f2ed]" : "border-[#e1e1e1]"}`}><input type="radio" name="rec" className="mt-1 accent-[#141413]" checked={rec === "approve"} onChange={() => setRec("approve")} /><span><b className="block">Approve for final review</b><span className="text-[13px] text-[#5c5a55]">The documents match the details and are clear.</span></span></label>
              <label className={`flex cursor-pointer gap-3 rounded-md border p-3 ${rec === "corrections" ? "border-[#141413] bg-[#f4f2ed]" : "border-[#e1e1e1]"}`}><input type="radio" name="rec" className="mt-1 accent-[#141413]" checked={rec === "corrections"} onChange={() => setRec("corrections")} /><span><b className="block">Request corrections</b><span className="text-[13px] text-[#5c5a55]">Something is unclear, mismatched or missing. Say what in your remarks.</span></span></label>
              <textarea className="min-h-24 w-full rounded-md border border-[#e1e1e1] p-3 text-[14px] outline-none focus:border-[#141413]" placeholder="Remarks for the super admin (what you checked, and what you found)" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              <button disabled={busy} className="w-full rounded-md bg-[#141413] py-3 text-[14px] font-medium text-white disabled:opacity-50" onClick={async () => {
                setBusy(true);
                try { await api("/api/kyc/review", "POST", { userId: id, recommendation: rec, remarks }); toast("Recommendation sent to the super admin"); onDone(); onClose(); } catch (e) { toast((e as Error).message, "err"); }
                setBusy(false);
              }}>Submit recommendation</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Where a KYC reviewer works: the cases assigned to them, and what they have already sent. */
export default function ReviewerHome() {
  const [d, setD] = useState<List | null>(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const load = useCallback(() => { api<List>("/api/kyc/review").then(setD).catch((e) => setErr((e as Error).message)); }, []);
  useEffect(() => { load(); }, [load]);

  if (err) return <div className="grid min-h-screen place-items-center p-6 text-center"><div><p className="text-[22px] font-semibold">Reviewer access needed</p><p className="mt-2 max-w-sm text-[#5c5a55]">{err === "Not logged in" ? "Sign in with the email the super admin added as a reviewer." : "This account is not a KYC reviewer. Ask the super admin to add your email."}</p><a href="/web/login?afterLoginRedirectTo=/reviewer" className="mt-5 inline-block rounded-md bg-[#141413] px-5 py-2.5 text-white">Sign in</a></div></div>;
  const list = (rows: Row[], empty: string) => rows.length === 0 ? <p className="py-8 text-center text-[14px] text-[#5c5a55]">{empty}</p> : (
    <div className="divide-y divide-[#ededed]">{rows.map((r) => (
      <button key={r.userId} onClick={() => setOpen(r.userId)} className="flex w-full flex-wrap items-center gap-3 py-3.5 text-left hover:bg-[#fafaf9]">
        <div className="min-w-0 flex-1"><p className="truncate font-medium">{r.legalName}</p><p className="truncate text-[12.5px] text-[#5c5a55]">{r.email} · {r.status === "assigned" ? `assigned ${when(r.assignedAt)}` : `reviewed ${when(r.reviewedAt)}`}</p></div>
        <span className="rounded-full border border-[#d3cfc7] px-3 py-1 text-[12px]">{r.status === "assigned" ? "Needs your review" : r.recommendation === "approve" ? "You recommended approval" : r.recommendation === "corrections" ? "You asked for corrections" : STATUS_TEXT[r.status]}</span>
      </button>
    ))}</div>
  );
  return (
    <div className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-start justify-between gap-3"><div><p className="text-[12px] uppercase tracking-[0.24em] text-[#5c5a55]">KYC reviews</p><h1 className="mt-1 text-[30px] font-semibold">{d ? `Hello, ${d.me.name.split(" ")[0]}` : "Loading…"}</h1><p className="text-[14px] text-[#5c5a55]">Check each person&apos;s documents against their details, then send your recommendation. The super admin makes the final decision.</p></div>
        <button className="text-[13px] underline" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/web/login"; }}>Sign out</button></div>
      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"><p className="text-[15px] font-semibold">Waiting for you {d && <span className="ml-1 rounded-full bg-[#141413] px-2 py-0.5 text-[12px] text-white">{d.todo.length}</span>}</p>{d ? list(d.todo, "Nothing assigned to you right now.") : <div className="mt-3 h-24 animate-pulse rounded bg-[#f4f2ed]" />}</div>
      <div className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5"><p className="text-[15px] font-semibold">Already reviewed</p>{d ? list(d.done, "No reviews yet.") : null}</div>
      {open && <Review id={open} onClose={() => setOpen(null)} onDone={load} />}
    </div>
  );
}
