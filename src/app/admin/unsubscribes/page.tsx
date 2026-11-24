"use client";
import { useMemo, useState } from "react";
import { downloadCsv } from "@/lib/client";
import { useAdminData } from "@/lib/adminClient";
import { Btn, DataTable, EmptySearch, Panel, Pill, Search, StatCard, Title, type Col } from "@/components/dash/kit";
import { LineChart } from "@/components/admin/charts";
import { ErrorBox, PageHead, Skeleton, day } from "@/components/admin/ui";

type Row = { id: string; email: string; creator: string; source: string; createdAt: string };
type Creator = { id: string; creator: string; sent: number; unsubscribed: number; leads: number; rate: number };
type D = { totals: { all: number; last30: number; emailsSent: number }; series: { labels: string[]; values: number[] }; sources: { source: string; count: number }[]; creators: Creator[]; rows: Row[] };

export default function Unsubscribes() {
  const { data: d, loading, error, reload } = useAdminData<D>("/api/admin/unsubscribes");
  const [q, setQ] = useState("");
  const rows = useMemo(() => (d?.rows || []).filter((r) => `${r.email} ${r.creator}`.toLowerCase().includes(q.toLowerCase())), [d, q]);
  if (error && !d) return <ErrorBox message={error} retry={reload} />;
  if (loading || !d) return <div className="space-y-4"><Skeleton h={100} /><Skeleton h={300} /></div>;
  const overall = d.totals.emailsSent ? Math.round((d.totals.all / d.totals.emailsSent) * 10000) / 100 : 0;
  const cc: Col<Creator & { id: string }>[] = [
    { key: "c", label: "Creator", sort: (a, b) => a.creator.localeCompare(b.creator), render: (c) => <b>{c.creator}</b> },
    { key: "s", label: "Emails sent", sort: (a, b) => a.sent - b.sent, render: (c) => c.sent },
    { key: "u", label: "Unsubscribed", sort: (a, b) => a.unsubscribed - b.unsubscribed, render: (c) => c.unsubscribed },
    { key: "r", label: "Unsubscribe rate", sort: (a, b) => a.rate - b.rate, render: (c) => <span className="inline-flex items-center gap-2"><b>{c.rate}%</b>{c.rate >= 2 && <Pill tone="red">High</Pill>}</span> },
    { key: "l", label: "Leads", render: (c) => c.leads },
  ];
  const rc: Col<Row>[] = [
    { key: "e", label: "Email", sort: (a, b) => a.email.localeCompare(b.email), render: (r) => r.email },
    { key: "c", label: "From creator", render: (r) => r.creator },
    { key: "s", label: "How", render: (r) => <Pill tone="grey">{r.source}</Pill> },
    { key: "d", label: "Date", sort: (a, b) => a.createdAt.localeCompare(b.createdAt), render: (r) => day(r.createdAt) },
  ];
  return (
    <>
      <PageHead title="Unsubscribes" sub="Who stopped getting emails, and which creators lose readers fastest." right={<><Btn variant="outline" icon="refresh" onClick={reload}>Refresh</Btn><Btn variant="outline" icon="download" disabled={!rows.length} onClick={() => downloadCsv("unsubscribes.csv", ["Email", "Creator", "How", "Date"], rows.map((r) => [r.email, r.creator, r.source, r.createdAt]))}>Export CSV</Btn></>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <StatCard icon="bell" label="Unsubscribed (all time)" value={d.totals.all} />
        <StatCard icon="analytics" label="Last 30 days" value={d.totals.last30} delay={0.04} />
        <StatCard icon="sales" label="Emails sent" value={d.totals.emailsSent} delay={0.08} />
        <StatCard icon="warning" label="Overall rate" value={`${overall}%`} sub={overall >= 2 ? "Above 2%: check the messages" : "Healthy: under 2%"} delay={0.12} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Panel className="p-5"><Title sub="Last 30 days">Unsubscribes per day</Title><div className="mt-3"><LineChart labels={d.series.labels} series={[{ name: "Unsubscribes", color: "#141413", values: d.series.values }]} /></div></Panel>
        <Panel className="p-5" delay={0.05}><Title sub="Where the request came from">How they left</Title>
          <div className="mt-3 divide-y divide-[#f0f0f0]">{d.sources.length === 0 && <p className="py-6 text-center text-[13px] text-[#9b9bab]">No unsubscribes yet</p>}{d.sources.map((s) => <div key={s.source} className="flex justify-between py-2.5 text-[13.5px]"><span className="capitalize">{s.source}</span><b>{s.count}</b></div>)}</div></Panel>
      </div>
      <Panel className="mt-5 p-5"><Title sub="A rate above 2% usually means the emails are too frequent or not what people signed up for.">By creator</Title><div className="mt-3"><DataTable cols={cc} rows={d.creators} empty={<EmptySearch title="No email activity yet" text="Rates appear once creators send emails." />} /></div></Panel>
      <Panel className="mt-5 p-5"><Title>Everyone who unsubscribed</Title>
        <div className="mt-3 flex"><Search value={q} onChange={setQ} placeholder="Search email or creator" /></div>
        <div className="mt-3"><DataTable cols={rc} rows={rows} empty={<EmptySearch title="Nobody has unsubscribed" text="They appear here when someone uses the unsubscribe link." />} /></div></Panel>
    </>
  );
}
