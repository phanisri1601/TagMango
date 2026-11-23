"use client";
import { useMemo, useState } from "react";
import { downloadCsv } from "@/lib/client";
import { useAdminData } from "@/lib/adminClient";
import { Btn, DataTable, EmptySearch, Panel, Pill, Search, StatCard, Tabs, type Col } from "@/components/dash/kit";
import { ErrorBox, PageHead, Skeleton, day } from "@/components/admin/ui";

type L = { id: string; createdAt: string; name: string; email: string; phone: string; status: string; coach: string; lessons: number; attended: number; missed: number };
type C = { id: string; code: string; name: string; email: string; title: string; course: string; issuedAt: string; coach: string };
const TABS = ["Learners", "Certificates"] as const;

export default function Learners() {
  const { data: d, loading, error, reload } = useAdminData<{ learners: L[]; certificates: C[]; totals: Record<string, number> }>("/api/admin/programme");
  const [tab, setTab] = useState<(typeof TABS)[number]>("Learners");
  const [q, setQ] = useState("");
  const match = (s: string) => s.toLowerCase().includes(q.toLowerCase());
  const learners = useMemo(() => (d?.learners || []).filter((l) => match(`${l.name} ${l.email} ${l.phone}`)), [d, q]); // eslint-disable-line react-hooks/exhaustive-deps
  const certs = useMemo(() => (d?.certificates || []).filter((c) => match(`${c.name} ${c.email} ${c.code}`)), [d, q]); // eslint-disable-line react-hooks/exhaustive-deps
  if (error && !d) return <ErrorBox message={error} retry={reload} />;
  if (loading || !d) return <div className="space-y-4"><Skeleton h={100} /><Skeleton h={300} /></div>;
  const lc: Col<L>[] = [
    { key: "n", label: "Learner", sort: (a, b) => a.name.localeCompare(b.name), render: (l) => <span><b className="block">{l.name}</b><span className="text-[12px] text-[#6b6b7b]">{l.email}</span></span> },
    { key: "p", label: "Phone", render: (l) => l.phone || "—" },
    { key: "c", label: "Coach", render: (l) => l.coach },
    { key: "l", label: "Lessons done", sort: (a, b) => a.lessons - b.lessons, render: (l) => l.lessons },
    { key: "a", label: "Classes", render: (l) => <span>{l.attended} attended{l.missed > 0 && <span className="text-[#cf1322]"> · {l.missed} missed</span>}</span> },
    { key: "s", label: "Status", render: (l) => <Pill tone={l.status === "active" ? "green" : "grey"}>{l.status}</Pill> },
    { key: "d", label: "Enrolled", sort: (a, b) => a.createdAt.localeCompare(b.createdAt), render: (l) => day(l.createdAt) },
  ];
  const cc: Col<C>[] = [
    { key: "n", label: "Name", render: (c) => <span><b className="block">{c.name}</b><span className="text-[12px] text-[#6b6b7b]">{c.email}</span></span> },
    { key: "t", label: "Certificate", render: (c) => c.title },
    { key: "co", label: "Coach", render: (c) => c.coach },
    { key: "cd", label: "Code", render: (c) => <code className="text-[12px]">{c.code}</code> },
    { key: "d", label: "Issued", sort: (a, b) => a.issuedAt.localeCompare(b.issuedAt), render: (c) => day(c.issuedAt) },
    { key: "v", label: "", render: (c) => <a className="text-[13px] underline" href={`/certificate/${c.code}`} target="_blank" rel="noreferrer">Verify</a> },
  ];
  return (
    <>
      <PageHead title="Learners and certificates" sub="Everyone enrolled in a programme, and every certificate issued." right={<Btn variant="outline" icon="download" onClick={() => tab === "Learners" ? downloadCsv("learners.csv", ["Name", "Email", "Phone", "Coach", "Lessons", "Attended", "Missed", "Status", "Enrolled"], learners.map((l) => [l.name, l.email, l.phone, l.coach, l.lessons, l.attended, l.missed, l.status, l.createdAt])) : downloadCsv("certificates.csv", ["Name", "Email", "Certificate", "Coach", "Code", "Issued"], certs.map((c) => [c.name, c.email, c.title, c.coach, c.code, c.issuedAt]))}>Export CSV</Btn>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <StatCard icon="customers" label="Learners" value={d.totals.learners} />
        <StatCard icon="star" label="Certificates issued" value={d.totals.certificates} delay={0.04} />
        <StatCard icon="check" label="Paid leads" value={d.totals.paid} delay={0.08} />
      </div>
      <Panel className="p-5">
        <div className="flex flex-wrap items-center gap-3"><Tabs tabs={[...TABS]} value={tab} onChange={setTab} /><Search value={q} onChange={setQ} placeholder="Search name, email or code" /></div>
        <div className="mt-3">{tab === "Learners" ? <DataTable cols={lc} rows={learners} loading={false} empty={<EmptySearch title="No learners yet" text="Learners appear here after they pay." />} /> : <DataTable cols={cc} rows={certs} loading={false} empty={<EmptySearch title="No certificates yet" text="Certificates are issued when a learner completes the programme." />} />}</div>
      </Panel>
    </>
  );
}
