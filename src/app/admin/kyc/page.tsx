"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api, toast } from "@/lib/client";
import { useAdminData, adminChanged } from "@/lib/adminClient";
import { Btn, Field, Modal, Panel, Pill, inputCls, areaCls } from "@/components/dash/kit";
import { ErrorBox, PageHead } from "@/components/admin/ui";
import CaseView, { STATUS_TEXT, when, type CaseData } from "@/components/kyc/CaseView";

type Row = { userId: string; name: string; email: string; legalName: string; status: string; submittedAt: string; reviewerEmail?: string; reviewerName?: string; recommendation?: string; reviewedAt?: string; finalAt?: string; finalBy?: string };
type Reviewer = { id: string; email: string; name: string };
const TABS = [["pending", "To assign"], ["assigned", "With reviewers"], ["reviewed", "Ready to decide"], ["done", "Decided"]] as const;
type Tab = (typeof TABS)[number][0];
const inTab = (r: Row, t: Tab) => (t === "done" ? ["verified", "rejected", "resubmit"].includes(r.status) : r.status === t);
const tone = (s: string) => (s === "verified" ? "green" : s === "rejected" ? "red" : "orange");

function CaseModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { data, loading, error, reload } = useAdminData<{ case: CaseData; reviewers: Reviewer[] }>(`/api/admin/kyc?user=${userId}`);
  const [rid, setRid] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const c = data?.case;
  const act = async (body: Record<string, unknown>, ok: string) => {
    setBusy(true);
    try { await api("/api/admin/kyc", "POST", { userId, ...body }); toast(ok); adminChanged(); await reload(); setNote(""); } catch (e) { toast((e as Error).message, "err"); }
    setBusy(false);
  };
  return (
    <Modal title={c ? `KYC: ${c.legalName}` : "KYC case"} onClose={onClose} wide>
      {loading && <div className="h-40 animate-pulse rounded-lg bg-[#f4f2ed]" />}
      {error && <ErrorBox message={error} />}
      {c && (
        <div className="space-y-5">
          <CaseView c={c} />
          {(c.status === "pending" || c.status === "assigned") && (
            <div className="rounded-lg border border-[#141413] p-4">
              <p className="text-[14px] font-semibold">Step 2: {c.status === "assigned" ? "Reassign the reviewer" : "Assign a reviewer"}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <select className={`${inputCls} max-w-xs`} value={rid} onChange={(e) => setRid(e.target.value)}><option value="">Choose a reviewer…</option>{data!.reviewers.map((r) => <option key={r.id} value={r.id}>{r.name} ({r.email})</option>)}</select>
                <Btn disabled={busy || !rid} onClick={() => act({ action: "assign", reviewerId: rid }, "Assigned to the reviewer")}>{c.status === "assigned" ? "Reassign" : "Assign"}</Btn>
              </div>
              {data!.reviewers.length === 0 && <p className="mt-2 text-[13px] text-[#5c5a55]">Add a reviewer first, in the list on the KYC page.</p>}
            </div>
          )}
          {c.status === "reviewed" && (
            <div className="rounded-lg border border-[#141413] p-4">
              <p className="text-[14px] font-semibold">Step 5: Final decision</p>
              <p className="mt-1 text-[13px] text-[#5c5a55]">The reviewer {c.recommendation === "approve" ? "recommends approval" : "asks for corrections"}. You decide.</p>
              <Field label="Reason (needed to reject or ask for resubmission; the creator sees it)"><textarea className={`${areaCls} min-h-20`} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
              <div className="mt-3 flex flex-wrap gap-2">
                <Btn disabled={busy} onClick={() => act({ action: "final", decision: "approve", note }, "KYC approved. The creator can now withdraw.")}>Approve</Btn>
                <Btn variant="outline" disabled={busy} onClick={() => act({ action: "final", decision: "resubmit", note }, "Resubmission requested")}>Request resubmission</Btn>
                <Btn variant="danger" disabled={busy} onClick={() => act({ action: "final", decision: "reject", note }, "KYC rejected")}>Reject</Btn>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Inner() {
  const { data, loading, error, reload } = useAdminData<{ rows: Row[]; reviewers: Reviewer[] }>("/api/admin/kyc");
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>("pending");
  const [open, setOpen] = useState<string | null>(null);
  const [rv, setRv] = useState({ name: "", email: "" });
  const [busy, setBusy] = useState(false);
  const rows = useMemo(() => data?.rows || [], [data]);
  useEffect(() => { const u = params.get("user"); if (u) setOpen(u); }, [params]);
  const counts = Object.fromEntries(TABS.map(([t]) => [t, rows.filter((r) => inTab(r, t)).length])) as Record<Tab, number>;
  const list = rows.filter((r) => inTab(r, tab));

  return (
    <div className="space-y-5">
      <PageHead title="KYC reviews" sub="Creators submit documents, you assign a reviewer, the reviewer recommends, and you make the final decision." />
      {error && <ErrorBox message={error} />}
      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Panel className="p-4">
          <div className="flex flex-wrap gap-1.5 border-b border-[#ededed] pb-3">
            {TABS.map(([t, l]) => <button key={t} onClick={() => setTab(t)} className={`rounded-full border px-4 py-1.5 text-[13px] transition ${tab === t ? "border-[#141413] bg-[#141413] text-white" : "border-[#d3cfc7] hover:border-[#141413]"}`}>{l} <b className="ml-1">{counts[t]}</b></button>)}
          </div>
          {loading ? <div className="mt-4 h-32 animate-pulse rounded bg-[#f4f2ed]" /> : list.length === 0 ? <p className="py-10 text-center text-[14px] text-[#5c5a55]">Nothing here right now.</p> : (
            <div className="mt-2 divide-y divide-[#ededed]">
              {list.map((r) => (
                <button key={r.userId} onClick={() => setOpen(r.userId)} className="flex w-full flex-wrap items-center gap-3 py-3 text-left transition hover:bg-[#fafaf9]">
                  <div className="min-w-0 flex-1"><p className="truncate font-medium">{r.legalName}</p><p className="truncate text-[12.5px] text-[#5c5a55]">{r.email} · submitted {when(r.submittedAt)}</p></div>
                  <div className="text-[12.5px] text-[#5c5a55]">{r.reviewerName ? `Reviewer: ${r.reviewerName}` : ""}{r.status === "reviewed" ? (r.recommendation === "approve" ? " · recommends approval" : " · asks for corrections") : ""}</div>
                  <Pill tone={tone(r.status)}>{r.status === "pending" ? "New" : r.status === "assigned" ? "Assigned" : r.status === "reviewed" ? "Decide" : r.status === "verified" ? "Approved" : r.status === "rejected" ? "Rejected" : "Resubmit"}</Pill>
                </button>
              ))}
            </div>
          )}
          <p className="mt-3 text-[12px] text-[#5c5a55]">{STATUS_TEXT[tab === "done" ? "verified" : tab]}</p>
        </Panel>

        <Panel className="h-fit p-4">
          <p className="text-[15px] font-semibold">KYC reviewers</p>
          <p className="text-[12.5px] text-[#5c5a55]">People who check the documents. They sign in with their email at <code>/reviewer</code>.</p>
          <div className="mt-3 space-y-2">
            {(data?.reviewers || []).map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 rounded-md bg-[#f4f2ed] px-3 py-2 text-[13px]"><span className="min-w-0"><b className="block truncate">{r.name}</b><span className="block truncate text-[#5c5a55]">{r.email}</span></span><button className="text-[12px] text-[#cf1322]" onClick={async () => { try { await api("/api/admin/kyc", "POST", { action: "reviewer-remove", id: r.id }); toast("Reviewer removed"); reload(); } catch (e) { toast((e as Error).message, "err"); } }}>Remove</button></div>
            ))}
            {data && data.reviewers.length === 0 && <p className="text-[13px] text-[#5c5a55]">No reviewers yet.</p>}
          </div>
          <div className="mt-3 space-y-2 border-t border-[#ededed] pt-3">
            <input className={inputCls} placeholder="Reviewer name" value={rv.name} onChange={(e) => setRv({ ...rv, name: e.target.value })} />
            <input className={inputCls} type="email" placeholder="Reviewer email" value={rv.email} onChange={(e) => setRv({ ...rv, email: e.target.value })} />
            <Btn disabled={busy} className="w-full" onClick={async () => { setBusy(true); try { await api("/api/admin/kyc", "POST", { action: "reviewer-add", ...rv }); toast("Reviewer added"); setRv({ name: "", email: "" }); reload(); } catch (e) { toast((e as Error).message, "err"); } setBusy(false); }}>Add reviewer</Btn>
          </div>
        </Panel>
      </div>
      {open && <CaseModal userId={open} onClose={() => { setOpen(null); reload(); }} />}
    </div>
  );
}

export default function KycAdmin() {
  return <Suspense><Inner /></Suspense>;
}
