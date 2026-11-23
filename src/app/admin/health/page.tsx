"use client";
import { useAdminData } from "@/lib/adminClient";
import { Btn, Panel, Pill, StatCard } from "@/components/dash/kit";
import { ErrorBox, PageHead, Skeleton, when } from "@/components/admin/ui";

type H = { items: { key: string; label: string; detail: string; ok: boolean; fix: string }[]; checkedAt: string };

export default function Health() {
  const { data: d, loading, error, reload } = useAdminData<H>("/api/admin/health");
  if (error && !d) return <ErrorBox message={error} retry={reload} />;
  if (loading || !d) return <Skeleton h={300} />;
  const bad = d.items.filter((i) => !i.ok);
  return (
    <>
      <PageHead title="System health" sub={`Checked ${when(d.checkedAt)}. Secret values are never shown.`} right={<Btn variant="outline" icon="refresh" onClick={reload}>Re-check</Btn>} />
      <div className="mb-4 flex flex-wrap gap-3">
        <StatCard icon="check" label="Connected" value={d.items.length - bad.length} sub={`of ${d.items.length} services`} />
        <StatCard icon="warning" label="Needs setup" value={bad.length} sub={bad.length ? "Fix before launch" : "All good"} delay={0.04} />
      </div>
      <Panel className="divide-y divide-[#f0f0f0] p-0">
        {d.items.map((i) => (
          <div key={i.key} className="flex flex-wrap items-center gap-3 px-5 py-4">
            <span className={`h-2.5 w-2.5 rounded-full ${i.ok ? "bg-[#00a400]" : "bg-[#cf1322]"}`} />
            <div className="min-w-0 flex-1"><p className="text-[14.5px] font-medium">{i.label}</p><p className="truncate text-[12.5px] text-[#6b6b7b]">{i.ok ? i.detail : i.fix}</p></div>
            <Pill tone={i.ok ? "green" : "red"}>{i.ok ? "Connected" : "Missing"}</Pill>
          </div>
        ))}
      </Panel>
    </>
  );
}
