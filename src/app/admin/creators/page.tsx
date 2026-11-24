"use client";
import { useEffect, useMemo, useState } from "react";
import { ago, downloadCsv, inr } from "@/lib/client";
import { useAdminData } from "@/lib/adminClient";
import type { AUser } from "@/lib/adminTypes";
import { PLAN_ORDER } from "@/components/dash/nav";
import { Btn, DataTable, EmptySearch, Field, Modal, Panel, Pill, Search, Select, StatCard, areaCls, inputCls, type Col } from "@/components/dash/kit";
import { adminAct } from "@/lib/adminClient";
import { toast } from "@/lib/client";
import CreatorDrawer from "@/components/admin/CreatorDrawer";
import { ErrorBox, Initial, PageHead, PlanBadge, day } from "@/components/admin/ui";

export default function Creators() {
  const { data, loading, error, reload } = useAdminData<{ users: AUser[] }>("/api/admin/users");
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("All plans");
  const [status, setStatus] = useState("All statuses");
  const [open, setOpen] = useState<string | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  const [bulk, setBulk] = useState<null | "suspend" | "unsuspend" | "notify">(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("open")) setOpen(sp.get("open"));
    if (sp.get("q")) setQ(sp.get("q") || "");
  }, []);
  async function runBulk() {
    if (!bulk) return;
    setBusy(true);
    try {
      const r = await adminAct<{ done: number; skipped: number }>("POST", "/api/admin/users/bulk", { ids: sel, action: bulk, reason: text, message: text });
      toast(`${r.done} creator(s) updated${r.skipped ? `, ${r.skipped} skipped (admins or already in that state)` : ""}`);
      setBulk(null); setText(""); setSel([]);
    } catch (e) { toast((e as Error).message, "err"); }
    setBusy(false);
  }

  const rows = useMemo(
    () =>
      (data?.users || [])
        .filter((u) => `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q.toLowerCase()))
        .filter((u) => plan === "All plans" || u.plan === plan)
        .filter((u) => {
          if (status === "All statuses") return true;
          if (status === "Active") return !u.suspended;
          if (status === "Suspended") return u.suspended;
          if (status === "KYC pending") return !u.kycDone;
          if (status === "Has sales") return u.stats.orders > 0;
          if (status === "Admins") return u.isAdmin;
          return true;
        }),
    [data, q, plan, status]
  );

  const all = data?.users || [];
  const cols: Col<AUser>[] = [
    {
      key: "name",
      label: "Creator",
      sort: (a, b) => a.name.localeCompare(b.name),
      render: (u) => (
        <button className="flex items-center gap-3 text-left" onClick={() => setOpen(u.id)}>
          <Initial name={u.name} />
          <span className="min-w-0"><span className="block truncate font-medium hover:text-[#141413]">{u.name}{u.isAdmin && <span className="ml-2 align-middle"><Pill tone="blue">Admin</Pill></span>}</span><span className="block truncate text-[12px] text-[#6b6b7b]">{u.email}</span></span>
        </button>
      ),
    },
    { key: "plan", label: "Plan", render: (u) => <PlanBadge plan={u.plan} />, sort: (a, b) => PLAN_ORDER.indexOf(a.plan) - PLAN_ORDER.indexOf(b.plan) },
    { key: "orders", label: "Orders", render: (u) => u.stats.orders, sort: (a, b) => a.stats.orders - b.stats.orders },
    { key: "gmv", label: "GMV", render: (u) => <b>{inr(u.stats.gmv)}</b>, sort: (a, b) => a.stats.gmv - b.stats.gmv },
    { key: "kyc", label: "KYC", render: (u) => (u.kycDone ? <Pill>Verified</Pill> : <Pill tone="grey">Pending</Pill>) },
    { key: "joined", label: "Joined", render: (u) => day(u.createdAt), sort: (a, b) => a.createdAt.localeCompare(b.createdAt) },
    { key: "login", label: "Last login", render: (u) => (u.lastLogin ? ago(u.lastLogin) : "never"), sort: (a, b) => (a.lastLogin || "").localeCompare(b.lastLogin || "") },
    { key: "status", label: "Status", render: (u) => (u.suspended ? <Pill tone="red">Suspended</Pill> : <Pill>Active</Pill>) },
    { key: "a", label: "", render: (u) => <Btn variant="outline" className="h-8 px-3 text-[13px]" onClick={() => setOpen(u.id)}>View</Btn> },
  ];

  if (error && !data) return <ErrorBox message={error} retry={reload} />;

  return (
    <>
      <PageHead
        title="Creators"
        sub="Every account on the platform."
        right={<Btn variant="outline" icon="download" disabled={!rows.length} onClick={() => downloadCsv("creators.csv", ["Name", "Email", "Phone", "Plan", "Orders", "GMV", "KYC", "Joined", "Suspended"], rows.map((u) => [u.name, u.email, u.phone, u.plan, u.stats.orders, u.stats.gmv, u.kycDone ? "Verified" : "Pending", u.createdAt, u.suspended ? "yes" : "no"]))}>Export CSV</Btn>}
      />
      <div className="mb-4 flex flex-wrap gap-3">
        <StatCard label="Total accounts" value={all.length} />
        <StatCard label="Paid plans" value={all.filter((u) => u.plan !== "basic").length} delay={0.04} />
        <StatCard label="With sales" value={all.filter((u) => u.stats.orders > 0).length} delay={0.08} />
        <StatCard label="Suspended" value={all.filter((u) => u.suspended).length} delay={0.12} />
      </div>
      <Panel className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Search value={q} onChange={setQ} placeholder="Search by name, email or phone" />
          <Select value={plan} onChange={setPlan} options={["All plans", ...PLAN_ORDER]} />
          <Select value={status} onChange={setStatus} options={["All statuses", "Active", "Suspended", "KYC pending", "Has sales", "Admins"]} />
          <span className="text-[13px] text-[#6b6b7b]">{rows.length} shown</span>
        </div>
        {sel.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-[#141413] px-4 py-2.5 text-[13px] text-white">
            <b>{sel.length} selected</b>
            <span className="ml-auto flex flex-wrap gap-2">
              <button className="rounded-md bg-white/15 px-3 py-1.5 hover:bg-white/25" onClick={() => { setText(""); setBulk("notify"); }}>Send message</button>
              <button className="rounded-md bg-white/15 px-3 py-1.5 hover:bg-white/25" onClick={() => { setText(""); setBulk("suspend"); }}>Suspend</button>
              <button className="rounded-md bg-white/15 px-3 py-1.5 hover:bg-white/25" onClick={() => { setText(""); setBulk("unsuspend"); }}>Reinstate</button>
              <button className="rounded-md bg-white/15 px-3 py-1.5 hover:bg-white/25" onClick={() => { const pick = rows.filter((u) => sel.includes(u.id)); downloadCsv("selected-creators.csv", ["Name", "Email", "Phone", "Plan", "Orders", "GMV"], pick.map((u) => [u.name, u.email, u.phone, u.plan, u.stats.orders, u.stats.gmv])); }}>Export</button>
              <button className="rounded-md px-3 py-1.5 text-white/70 hover:text-white" onClick={() => setSel([])}>Clear</button>
            </span>
          </div>
        )}
        <div className="mt-3"><DataTable cols={cols} rows={rows} loading={loading} selectable selected={sel} onSelect={setSel} empty={<EmptySearch title="No creators match" text="Try clearing the filters." />} /></div>
      </Panel>
      {bulk && (
        <Modal title={bulk === "notify" ? `Message ${sel.length} creator(s)` : bulk === "suspend" ? `Suspend ${sel.length} creator(s)` : `Reinstate ${sel.length} creator(s)`} onClose={() => setBulk(null)}>
          {bulk === "unsuspend" ? <p className="text-[14px] text-[#4a4a59]">They can sign in again straight away, and each one is told their account is back.</p> : (
            <Field label={bulk === "notify" ? "Message (shown in their notifications)" : "Reason (recorded in the audit log)"}>
              {bulk === "notify" ? <textarea className={`${areaCls} min-h-24`} maxLength={500} value={text} onChange={(e) => setText(e.target.value)} /> : <input className={inputCls} maxLength={200} value={text} onChange={(e) => setText(e.target.value)} />}
            </Field>
          )}
          {bulk === "suspend" && <p className="mt-2 text-[12.5px] text-[#6b6b7b]">Suspended creators are signed out everywhere. Admin accounts are never suspended.</p>}
          <div className="mt-5 flex justify-end gap-2"><Btn variant="outline" onClick={() => setBulk(null)}>Cancel</Btn><Btn variant={bulk === "suspend" ? "danger" : "orange"} disabled={busy || (bulk !== "unsuspend" && !text.trim())} onClick={runBulk}>{busy ? "Please wait…" : bulk === "notify" ? "Send" : bulk === "suspend" ? "Suspend" : "Reinstate"}</Btn></div>
        </Modal>
      )}
      {open && <CreatorDrawer id={open} onClose={() => setOpen(null)} />}
    </>
  );
}
