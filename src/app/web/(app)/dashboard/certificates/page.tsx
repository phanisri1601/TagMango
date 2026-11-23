"use client";
import { useEffect, useState } from "react";
import { api, copy, fmtDateTime, toast, useCollection, useMe, type Row } from "@/lib/client";
import { Btn, Confirm, DataTable, EmptySearch, Modal, Panel, Pill, RowAction, Search, Title, Walkthrough, type Col } from "@/components/dash/kit";
import { FormDrawer } from "@/components/dash/forms";
import { useCustomers, useMangoTitles } from "@/components/dash/hooks";
import Certificate, { CERT_DESIGNS, normalizeDesign } from "@/components/Certificate";

type Issued = { id: string; name: string; email: string; code: string; issuedAt: string };

export default function Certificates() {
  const { me } = useMe();
  const col = useCollection("certificates");
  const courses = useCollection("courses");
  const workshops = useCollection("workshops");
  const mangoes = useMangoTitles();
  const { list: customers } = useCustomers();
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<{ design: string; title?: string; course?: string; signer?: string; signerTitle?: string; details?: string } | null>(null);
  const [as, setAs] = useState("");
  const [edit, setEdit] = useState<Row | { design: string } | null>(null);
  const [send, setSend] = useState<Row | null>(null);
  const [del, setDel] = useState<Row | null>(null);
  const [issued, setIssued] = useState<{ cert: Row; rows: Issued[] } | null>(null);

  const active = customers.filter((x) => x.status === "Active");
  const recipients = (c: Row) => active.filter((x) => !c.mango || x.mango === c.mango);
  // preview wording uses a real customer's name, so you see exactly what a learner gets
  const sample = active.find((x) => x.email === as) || active[0];
  const sampleName = sample?.name || "Learner Name";
  const origin = typeof window === "undefined" ? "" : window.location.host;
  const data = (o: { design?: string; title?: string; course?: string; signer?: string; signerTitle?: string; details?: string }) => ({
    design: o.design, title: o.title || "Certificate of Completion", name: sampleName, course: o.course || "Course name", issuer: me.name,
    signer: o.signer || me.name, signerTitle: o.signerTitle || "", details: o.details || "", code: "NR-XXXXXXXXXX", verifyHost: origin,
  });
  const issuedCount = (r: Row) => ((r.sentTo as string[]) || []).length;

  useEffect(() => { setAs(""); }, [preview]);
  const rows = col.rows.filter((c) => String(c.title).toLowerCase().includes(q.toLowerCase()));
  const cols: Col<Row>[] = [
    { key: "t", label: "Certificate", render: (r) => <div className="flex items-center gap-3"><div className="w-24 shrink-0 overflow-hidden rounded border border-[#ededed]"><Certificate data={data({ design: String(r.design), title: String(r.title), course: String(r.forRef || "") })} /></div><div><p className="font-medium">{String(r.title)}</p><p className="text-[12px] text-[#5c5a55]">{String(r.forKind)}: {String(r.forRef || "Any")}</p></div></div> },
    { key: "s", label: "Status", render: (r) => <Pill tone={r.active ? "green" : "grey"}>{r.active ? "Active" : "Draft"}</Pill> },
    { key: "n", label: "Issued", render: (r) => <button className="underline" onClick={async () => { const j = await api<{ rows: Issued[] }>(`/api/certificates/issue?certId=${r.id}`); setIssued({ cert: r, rows: j.rows }); }}>{issuedCount(r)}</button> },
    { key: "time", label: "Last sent", render: (r) => fmtDateTime(String(r.lastSent || r.createdAt)) },
    { key: "a", label: "Action", render: (r) => <div className="flex gap-1.5"><Btn className="h-8 px-3 text-[13px]" onClick={() => setSend(r)}>Send</Btn><RowAction icon="eye" title="Preview" onClick={() => setPreview({ design: String(r.design), title: String(r.title), course: String(r.forRef || ""), signer: String(r.signer || ""), signerTitle: String(r.signerTitle || ""), details: String(r.details || "") })} /><RowAction icon="edit" title="Edit" onClick={() => setEdit(r)} /><RowAction icon="trash" title="Delete" danger onClick={() => setDel(r)} /></div> },
  ];

  return (
    <>
      <Walkthrough title="Creating certificates" />
      <Panel className="p-5">
        <Title sub="Pick a design. The learner's name, the course, the date and a verifiable credential ID are filled in automatically for each person.">Templates</Title>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {CERT_DESIGNS.map((d) => (
            <div key={d.id} className="rounded-[12px] border border-[#ededed] p-3 transition hover:shadow-[0_14px_34px_-20px_rgba(0,0,0,0.35)]">
              <div className="overflow-hidden rounded border border-[#ededed]"><Certificate data={data({ design: d.id, course: "Course name" })} /></div>
              <div className="mt-3 space-y-2">
                <div><p className="text-[14px] font-semibold">{d.name}</p><p className="text-[12px] text-[#5c5a55]">{d.note}</p></div>
                <div className="flex gap-1.5"><Btn className="h-8 px-3 text-[12px]" onClick={() => setEdit({ design: d.id })}>Use this</Btn><Btn variant="outline" className="h-8 px-3 text-[12px]" onClick={() => setPreview({ design: d.id })}>Preview</Btn></div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <Panel className="mt-5 p-5" delay={0.06}>
        <Title>Your certificates</Title>
        <div className="mt-4 flex"><Search value={q} onChange={setQ} placeholder="Search by certificate title" /></div>
        <div className="mt-3"><DataTable cols={cols} rows={rows} loading={col.loading} empty={<EmptySearch title="Create your first certificate!" text="Reward your customers for attending workshops or completing courses!" />} /></div>
      </Panel>

      {preview && (
        <Modal title="Certificate preview" onClose={() => setPreview(null)} wide>
          {active.length > 0 ? (
            <label className="mb-3 flex items-center gap-2 text-[13px]">Preview as
              <select className="rounded-md border border-[#e1e1e1] px-2 py-1.5" value={as || active[0].email} onChange={(e) => setAs(e.target.value)}>{active.map((c) => <option key={c.email} value={c.email}>{c.name} ({c.email})</option>)}</select>
            </label>
          ) : <p className="mb-3 text-[12px] text-[#5c5a55]">No customers yet, so a sample name is shown. Each customer&apos;s own name is used when you send.</p>}
          <div className="overflow-hidden rounded border border-[#ededed]"><Certificate data={data(preview)} /></div>
          <div className="mt-4 flex justify-end"><Btn variant="outline" icon="download" onClick={() => window.print()}>Print / Save as PDF</Btn></div>
        </Modal>
      )}
      {edit && (
        <FormDrawer
          title={"id" in edit ? "Edit certificate" : "Create certificate"}
          intro={<div className="overflow-hidden rounded border border-[#ededed]"><Certificate data={data({ design: String(edit.design), title: "title" in edit ? String(edit.title) : undefined, course: "forRef" in edit ? String(edit.forRef || "") : undefined, signer: "signer" in edit ? String(edit.signer || "") : undefined, signerTitle: "signerTitle" in edit ? String(edit.signerTitle || "") : undefined, details: "details" in edit ? String(edit.details || "") : undefined })} /></div>}
          fields={[
            { key: "title", label: "Certificate title", required: true, maxLength: 60 },
            { key: "design", label: "Design", type: "select", options: CERT_DESIGNS.map((d) => d.id), required: true },
            { key: "forKind", label: "Issued for", type: "select", options: ["Course completion", "Workshop attendance", "Mango purchase"], required: true },
            { key: "forRef", label: "Course or workshop name (printed on the certificate)", type: "select", options: [...courses.rows.map((c) => String(c.title)), ...workshops.rows.map((w) => String(w.title))] },
            { key: "details", label: "Extra line (optional)", placeholder: "e.g. 6 weeks · 24 hours of learning", maxLength: 80 },
            { key: "mango", label: "Send to customers of", type: "select", options: mangoes, hint: "Leave empty to send to all active customers" },
            { key: "signer", label: "Signed by", required: true },
            { key: "signerTitle", label: "Signer's title", placeholder: "e.g. Founder and Lead Coach", maxLength: 60 },
            { key: "active", label: "Active", type: "toggle" },
          ]}
          initial={{ title: "Certificate of Completion", forKind: "Course completion", signer: me.name, active: true, ...edit, design: normalizeDesign(edit.design) }}
          submitLabel="Save"
          onClose={() => setEdit(null)}
          onSubmit={async (d) => { if ("id" in edit) await col.update(edit.id as string, d); else await col.create({ ...d, sentTo: [] }); toast("Certificate saved"); }}
        />
      )}
      {send && (
        <Confirm
          title="Send certificate?"
          danger={false}
          okLabel={`Send to ${recipients(send).length}`}
          text={recipients(send).length ? <>Each of the {recipients(send).length} active customer(s){send.mango ? ` of ${String(send.mango)}` : ""} gets “{String(send.title)}” with their own name on it, plus an email with a link to view, download or share it. Customers who already have it are skipped.</> : "There are no active customers in this audience yet."}
          onOk={async () => {
            const r = await api<{ issued: number; skipped: number }>("/api/certificates/issue", "POST", { certId: send.id });
            col.reload();
            toast(r.issued ? `Certificate issued to ${r.issued} customer(s)` : "Everyone in this audience already has it");
          }}
          onClose={() => setSend(null)}
        />
      )}
      {issued && (
        <Modal title={`Issued: ${String(issued.cert.title)}`} onClose={() => setIssued(null)} wide>
          {issued.rows.length === 0 ? <p className="py-6 text-center text-[#5c5a55]">Nothing issued yet.</p> : (
            <div className="max-h-[60vh] divide-y divide-[#ededed] overflow-y-auto">
              {issued.rows.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 py-3 text-[14px]">
                  <div className="min-w-0"><p className="truncate font-medium">{r.name}</p><p className="truncate text-[12px] text-[#5c5a55]">{r.email} · {r.code} · {fmtDateTime(r.issuedAt)}</p></div>
                  <div className="flex shrink-0 gap-2"><Btn variant="outline" className="h-8 px-3 text-[12px]" onClick={() => copy(`${window.location.origin}/certificate/${r.code}`, "Certificate link")}>Copy link</Btn><a className="inline-flex h-8 items-center rounded-md bg-[#141413] px-3 text-[12px] text-white" href={`/certificate/${r.code}`} target="_blank" rel="noreferrer">Open</a></div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
      {del && <Confirm title="Delete certificate?" text="Already-issued certificates are not revoked." onOk={async () => { await col.remove(del.id); toast("Certificate deleted"); }} onClose={() => setDel(null)} />}
    </>
  );
}
