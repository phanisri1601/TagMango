"use client";
import { useEffect, useMemo, useState } from "react";
import { downloadCsv } from "@/lib/client";
import { useAdminData } from "@/lib/adminClient";
import { Btn, DataTable, EmptySearch, Panel, Pill, Search, Select, StatCard, Title, type Col } from "@/components/dash/kit";
import { LineChart, HBar } from "@/components/admin/charts";
import { ErrorBox, PageHead, Skeleton, day } from "@/components/admin/ui";

type Lead = { id: string; createdAt: string; name: string; email: string; phone: string; source: string; stage: string; stageLabel: string; coach: string; pattern: string; paid: boolean };
type D = {
  totals: Record<string, number>;
  funnel: { steps: { key: string; label: string; sub: string; entered: number; dropPct: number }[]; groups: { key: string; label: string; count: number }[]; bySource: { source: string; leads: number; paid: number }[] };
  series: { labels: string[]; leads: number[] };
  byChannel: { channel: string; sent: number; failed: number }[];
  leads: Lead[];
};

export default function Leads() {
  const { data: d, loading, error, reload } = useAdminData<D>("/api/admin/programme");
  const [q, setQ] = useState("");
  useEffect(() => { const v = new URLSearchParams(window.location.search).get("q"); if (v) setQ(v); }, []);
  const [stage, setStage] = useState("All stages");
  const [src, setSrc] = useState("All sources");
  const rows = useMemo(() => (d?.leads || []).filter((l) => `${l.name} ${l.email} ${l.phone}`.toLowerCase().includes(q.toLowerCase())).filter((l) => stage === "All stages" || l.stageLabel === stage).filter((l) => src === "All sources" || l.source === src), [d, q, stage, src]);
  if (error && !d) return <ErrorBox message={error} retry={reload} />;
  if (loading || !d) return <div className="space-y-4"><Skeleton h={100} /><Skeleton h={300} /></div>;
  const top = d.funnel.steps[0]?.entered || 1;
  const cols: Col<Lead>[] = [
    { key: "name", label: "Lead", sort: (a, b) => a.name.localeCompare(b.name), render: (l) => <span><b className="block">{l.name || "Unknown"}</b><span className="text-[12px] text-[#6b6b7b]">{l.email}</span></span> },
    { key: "phone", label: "Phone", render: (l) => l.phone || "—" },
    { key: "src", label: "Source", render: (l) => <Pill tone="grey">{l.source}</Pill> },
    { key: "stage", label: "Funnel stage", render: (l) => l.paid ? <Pill>Paid</Pill> : <Pill tone="orange">{l.stageLabel}</Pill> },
    { key: "pattern", label: "Pattern", render: (l) => l.pattern || "—" },
    { key: "coach", label: "Coach", render: (l) => l.coach },
    { key: "at", label: "Joined", sort: (a, b) => a.createdAt.localeCompare(b.createdAt), render: (l) => day(l.createdAt) },
  ];
  return (
    <>
      <PageHead title="Leads and funnel" sub="Every lead captured across the platform, from first click to paid." right={<><Btn variant="outline" icon="refresh" onClick={reload}>Refresh</Btn><Btn variant="outline" icon="download" disabled={!rows.length} onClick={() => downloadCsv("leads.csv", ["Name", "Email", "Phone", "Source", "Stage", "Pattern", "Coach", "Joined"], rows.map((l) => [l.name, l.email, l.phone, l.source, l.stageLabel, l.pattern, l.coach, l.createdAt]))}>Export CSV</Btn></>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <StatCard icon="customers" label="Total leads" value={d.totals.leads} sub={`+${d.totals.leads30} in 30 days`} />
        <StatCard icon="check" label="Paid learners" value={d.totals.paid} sub={d.totals.leads ? `${Math.round((d.totals.paid / d.totals.leads) * 100)}% of leads` : ""} delay={0.04} />
        <StatCard icon="eye" label="Link clicks" value={d.totals.clicks} delay={0.08} />
        <StatCard icon="bell" label="Messages sent" value={d.totals.messages} sub={`${d.totals.failed} failed`} delay={0.12} />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Panel className="p-5"><Title sub="Where leads reach, and where they drop">Funnel</Title>
          <div className="mt-4 space-y-3">{d.funnel.steps.map((s) => (
            <div key={s.key}><div className="flex justify-between text-[13px]"><span><b>{s.label}</b> <span className="text-[#6b6b7b]">{s.sub}</span></span><span><b>{s.entered}</b>{s.dropPct > 0 && <span className="ml-2 text-[#cf1322]">−{s.dropPct}%</span>}</span></div>
              <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[#f0eee9]"><div className="h-full rounded-full bg-[#141413] transition-all" style={{ width: `${Math.max(2, (s.entered / top) * 100)}%` }} /></div></div>))}</div>
        </Panel>
        <Panel className="p-5" delay={0.05}><Title sub="Last 30 days">New leads per day</Title><div className="mt-3"><LineChart labels={d.series.labels} series={[{ name: "Leads", color: "#141413", values: d.series.leads }]} /></div></Panel>
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Panel className="p-5"><Title sub="Who needs a follow-up">Stuck groups</Title><div className="mt-4"><HBar items={d.funnel.groups.map((g) => ({ label: g.label, value: g.count, color: "#141413" }))} /></div></Panel>
        <Panel className="p-5" delay={0.05}><Title sub="Leads and paid by source">Sources</Title>
          <div className="mt-3 divide-y divide-[#f0f0f0]">{d.funnel.bySource.length === 0 && <p className="py-5 text-center text-[13px] text-[#9b9bab]">No data yet</p>}{d.funnel.bySource.slice(0, 8).map((s) => <div key={s.source} className="flex justify-between py-2 text-[13px]"><span>{s.source}</span><span><b>{s.leads}</b> leads · <b>{s.paid}</b> paid</span></div>)}</div></Panel>
        <Panel className="p-5" delay={0.1}><Title sub="Delivery by channel">Messages</Title>
          <div className="mt-3 divide-y divide-[#f0f0f0]">{d.byChannel.map((c) => <div key={c.channel} className="flex justify-between py-2 text-[13px]"><span className="capitalize">{c.channel}</span><span><b>{c.sent}</b> sent{c.failed > 0 && <span className="ml-2 text-[#cf1322]">{c.failed} failed</span>}</span></div>)}</div></Panel>
      </div>
      <Panel className="mt-5 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Search value={q} onChange={setQ} placeholder="Search name, email or phone" />
          <Select value={stage} onChange={setStage} options={["All stages", ...d.funnel.steps.map((s) => s.label)]} />
          <Select value={src} onChange={setSrc} options={["All sources", ...d.funnel.bySource.map((s) => s.source)]} />
          <span className="text-[13px] text-[#6b6b7b]">{rows.length} shown</span>
        </div>
        <div className="mt-3"><DataTable cols={cols} rows={rows} loading={false} empty={<EmptySearch title="No leads match" text="Try clearing the filters." />} /></div>
      </Panel>
    </>
  );
}
