"use client";
import { useEffect, useRef, useState } from "react";
import { api, toast } from "@/lib/client";
import { Btn, Confirm, Field, Modal, Note, Panel, Pill, Title, Toggle, areaCls, inputCls } from "@/components/dash/kit";
import { FLOW_VARS, TRIGGERS, type CustomFlow, type FlowDef, type Milestone } from "@/lib/growth/model";

type Stats = { sent: number; opened: number; clicked: number; acted: number };
type Can = { edit: boolean; create: boolean; max: number };
type CustomRow = CustomFlow & { flowId: string; stats: Stats; stepStats: Record<string, Stats> };
type Flow = FlowDef & { enabled: boolean; overrides: Record<string, { subject?: string; body?: string; off?: boolean }>; stats: Stats; stepStats: Record<string, Stats> };

const when = (m: number, rel?: string) => {
  const a = Math.abs(m);
  const t = a >= 1440 ? `${Math.round(a / 1440)} day${a >= 2880 ? "s" : ""}` : a >= 60 ? `${Math.round(a / 60)} hour${a >= 120 ? "s" : ""}` : `${a} min`;
  return m === 0 ? "Immediately" : m < 0 ? `${t} before` : `${t} after${rel ? "" : ""}`;
};
const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 100)}%` : "—");

function FlowCard({ f, reload, canEdit }: { f: Flow; reload: () => void; canEdit: boolean }) {
  const [open, setOpen] = useState(false);
  const [ov, setOv] = useState(f.overrides);
  const [en, setEn] = useState(f.enabled);
  const save = async (enabled = en, overrides = ov) => {
    await api("/api/growth", "POST", { action: "flow-save", flowId: f.id, enabled, overrides });
    toast("Saved");
    reload();
  };
  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[#6b6b7b]">WORKFLOW {f.n}</p>
          <p className="text-[16px] font-semibold">{f.name}</p>
          <p className="text-[13px] text-[#4a4a59]">When: {f.trigger}</p>
          <p className="mt-1 text-[12px] text-[#6b6b7b]">{f.stopOn.length ? "Stops when they: " + f.stopOn.join(", ") : "Runs to the end"}{f.sales ? " · never messages anyone who has paid" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12.5px] text-[#4a4a59]">Sent <b>{f.stats.sent}</b> · Opened <b>{f.stats.opened}</b> ({pct(f.stats.opened, f.stats.sent)}) · Clicked <b>{f.stats.clicked}</b> ({pct(f.stats.clicked, f.stats.sent)}) · Acted <b>{f.stats.acted}</b> ({pct(f.stats.acted, f.stats.sent)})</span>
          <Toggle on={en} onChange={(v) => { setEn(v); save(v); }} />
        </div>
      </div>
      {f.note && <p className="mt-2 text-[12.5px] text-[#6b6b7b]">{f.note}</p>}
      {f.steps.length > 0 && <button className="mt-3 text-[13px] text-[#141413] underline" onClick={() => setOpen(!open)}>{open ? "Hide messages" : `Show ${f.steps.length} message${f.steps.length > 1 ? "s" : ""}`}</button>}
      {open && (
        <div className="mt-3 space-y-3">
          {f.steps.map((s) => {
            const o = ov[s.key] || {};
            const st = f.stepStats[s.key];
            const set = (patch: Record<string, unknown>) => setOv({ ...ov, [s.key]: { ...o, ...patch } });
            return (
              <div key={s.key} className={`rounded-lg border border-[#ededed] p-3 ${o.off ? "opacity-50" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2"><Pill tone={s.channel === "email" ? "blue" : "green"}>{s.channel}</Pill><span className="text-[13px] text-[#4a4a59]">{when(s.at, s.rel)}{s.rel ? " the event" : ""}</span></div>
                  <span className="text-[12px] text-[#6b6b7b]">sent {st.sent} · opened {st.opened} · clicked {st.clicked} · acted {st.acted}</span>
                </div>
                {s.channel === "email" && <input className={`${inputCls} mt-2`} readOnly={!canEdit} value={o.subject ?? s.subject ?? ""} onChange={(e) => set({ subject: e.target.value })} />}
                <textarea className={`${areaCls} mt-2 min-h-24`} readOnly={!canEdit} value={o.body ?? s.body} onChange={(e) => set({ body: e.target.value })} />
                <label className="mt-1 flex items-center gap-2 text-[12.5px]"><input type="checkbox" className="accent-[#141413]" checked={!!o.off} onChange={(e) => set({ off: e.target.checked })} /> Turn this message off</label>
              </div>
            );
          })}
          {canEdit ? <div className="flex gap-2"><Btn onClick={() => save()}>Save messages</Btn><Btn variant="outline" onClick={() => { setOv({}); save(en, {}); }}>Restore defaults</Btn></div> : <Note tone="yellow">Editing the wording of these messages is a Pro feature. You can still switch the workflow on or off.</Note>}
        </div>
      )}
    </Panel>
  );
}

const UNITS: [string, number][] = [["minutes", 1], ["hours", 60], ["days", 1440]];
const split = (m: number): [number, number] => { for (const [, u] of [...UNITS].reverse()) if (m >= u && m % u === 0) return [m / u, u]; return [m, 1]; };
type Row = { channel: "email" | "whatsapp"; amount: number; unit: number; subject: string; body: string };
const blank = (): Row => ({ channel: "email", amount: 0, unit: 60, subject: "", body: "" });

/** Create or edit a workflow of your own: when it starts, what it sends and when, and when it stops. */
function Editor({ flow, onClose, onSaved }: { flow: CustomRow | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(flow?.name || "");
  const [trigger, setTrigger] = useState<Milestone | "">(flow?.trigger || "");
  const [rows, setRows] = useState<Row[]>(flow?.steps?.length ? flow.steps.map((s) => { const [a, u] = split(s.at); return { channel: s.channel, amount: a, unit: u, subject: s.subject || "", body: s.body }; }) : [blank()]);
  const [stopOn, setStopOn] = useState<Milestone[]>(flow?.stopOn || []);
  const [sales, setSales] = useState(flow ? flow.sales : true);
  const [goal, setGoal] = useState<string>(flow?.goal || "");
  const [busy, setBusy] = useState(false);
  const areas = useRef<Record<number, HTMLTextAreaElement | null>>({});
  const set = (i: number, p: Partial<Row>) => setRows((r) => r.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const insert = (i: number, v: string) => { const el = areas.current[i]; const at = el?.selectionStart ?? rows[i].body.length; const b = rows[i].body; set(i, { body: b.slice(0, at) + `{${v}}` + b.slice(el?.selectionEnd ?? at) }); setTimeout(() => el?.focus(), 0); };
  const label = (k: Milestone) => TRIGGERS.find(([x]) => x === k)?.[1] || k;

  async function save() {
    setBusy(true);
    try {
      await api("/api/growth", "POST", { action: "custom-flow-save", id: flow?.id, name, trigger, stopOn, sales, goal: goal || null, enabled: flow ? flow.enabled : true, steps: rows.map((r) => ({ channel: r.channel, at: Math.round((Number(r.amount) || 0) * r.unit), subject: r.subject, body: r.body })) });
      toast(flow ? "Workflow saved" : "Workflow created");
      onSaved();
      onClose();
    } catch (e) { toast((e as Error).message, "err"); }
    setBusy(false);
  }

  return (
    <Modal title={flow ? "Edit workflow" : "New workflow"} onClose={onClose} wide>
      <div className="max-h-[72vh] space-y-5 overflow-y-auto pr-1">
        <Field label="Workflow name"><input className={inputCls} maxLength={60} placeholder="e.g. Thank you after the masterclass" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="1. When does it start?" hint="It starts for each person at the moment this happens."><select className={inputCls} value={trigger} onChange={(e) => setTrigger(e.target.value as Milestone)}><option value="">Choose a moment…</option>{TRIGGERS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>

        <div>
          <p className="mb-2 text-[14px] font-medium">2. What does it send?</p>
          <div className="space-y-3">
            {rows.map((r, i) => (
              <div key={i} className="rounded-[10px] border border-[#ededed] bg-[#fafaf9] p-3">
                <div className="flex flex-wrap items-center gap-2 text-[13px]">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-[#141413] text-[12px] text-white">{i + 1}</span>
                  <select className="rounded-md border border-[#e1e1e1] bg-white px-2 py-1.5" value={r.channel} onChange={(e) => set(i, { channel: e.target.value as Row["channel"] })}><option value="email">Email</option><option value="whatsapp">WhatsApp</option></select>
                  <span>send</span>
                  <input type="number" min={0} className="w-16 rounded-md border border-[#e1e1e1] bg-white px-2 py-1.5" value={r.amount} onChange={(e) => set(i, { amount: Number(e.target.value) })} />
                  <select className="rounded-md border border-[#e1e1e1] bg-white px-2 py-1.5" value={r.unit} onChange={(e) => set(i, { unit: Number(e.target.value) })}>{UNITS.map(([l, v]) => <option key={l} value={v}>{l}</option>)}</select>
                  <span>after it starts{r.amount === 0 ? " (right away)" : ""}</span>
                  {rows.length > 1 && <button className="ml-auto text-[12px] text-[#cf1322]" onClick={() => setRows(rows.filter((_, k) => k !== i))}>Remove</button>}
                </div>
                {r.channel === "email" && <input className={`${inputCls} mt-2`} placeholder="Email subject" value={r.subject} onChange={(e) => set(i, { subject: e.target.value })} />}
                <textarea ref={(el) => { areas.current[i] = el; }} className={`${areaCls} mt-2 min-h-24`} placeholder={r.channel === "email" ? "Write the email…" : "Write the WhatsApp message (short and friendly)…"} value={r.body} onChange={(e) => set(i, { body: e.target.value })} />
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[12px]"><span className="text-[#5c5a55]">Insert:</span>{FLOW_VARS.map(([v, l]) => <button key={v} type="button" onClick={() => insert(i, v)} className="rounded-full border border-[#d3cfc7] bg-white px-2.5 py-0.5 hover:border-[#141413]">{l}</button>)}</div>
              </div>
            ))}
          </div>
          {rows.length < 10 && <button type="button" className="mt-2 w-full rounded-md border border-dashed border-[#bdb8ac] py-2 text-[13px] hover:border-[#141413]" onClick={() => setRows([...rows, { ...blank(), amount: 1, unit: 1440 }])}>+ Add another message</button>}
          <p className="mt-2 text-[12px] text-[#5c5a55]">WhatsApp messages only go to people who ticked the WhatsApp opt-in. Every email ends with an unsubscribe link.</p>
        </div>

        <div>
          <p className="mb-2 text-[14px] font-medium">3. When does it stop?</p>
          <label className="mb-2 flex items-center gap-2 text-[13.5px]"><Toggle on={sales} onChange={setSales} />This is a sales message: never send it to anyone who has paid</label>
          <p className="mb-1.5 text-[13px] text-[#5c5a55]">Also stop sending the rest as soon as…</p>
          <div className="flex flex-wrap gap-1.5">{TRIGGERS.map(([k]) => { const on = stopOn.includes(k); return <button key={k} type="button" onClick={() => setStopOn(on ? stopOn.filter((x) => x !== k) : [...stopOn, k])} className={`rounded-full border px-3 py-1 text-[12.5px] transition ${on ? "border-[#141413] bg-[#141413] text-white" : "border-[#d3cfc7] bg-white hover:border-[#141413]"}`}>{on ? "✓ " : ""}{label(k)}</button>; })}</div>
        </div>

        <Field label="4. What counts as success? (optional)" hint="Messages are counted as “acted on” when the person reaches this."><select className={inputCls} value={goal} onChange={(e) => setGoal(e.target.value)}><option value="">Nothing in particular</option>{TRIGGERS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
      </div>
      <div className="mt-4 flex justify-end gap-2 border-t border-[#ededed] pt-4"><Btn variant="outline" onClick={onClose}>Cancel</Btn><Btn onClick={save} disabled={busy}>{busy ? "Saving…" : flow ? "Save workflow" : "Create workflow"}</Btn></div>
    </Modal>
  );
}

function CustomCard({ c, reload, onEdit }: { c: CustomRow; reload: () => void; onEdit: () => void }) {
  const [en, setEn] = useState(c.enabled);
  const [del, setDel] = useState(false);
  const trig = TRIGGERS.find(([k]) => k === c.trigger)?.[1] || c.trigger;
  return (
    <Panel className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[12px] font-medium text-[#5c5a55]">CUSTOM WORKFLOW <Pill tone="blue">Yours</Pill></p>
          <p className="text-[16px] font-semibold">{c.name}</p>
          <p className="text-[13px] text-[#4a4a59]">When: {trig}</p>
          <p className="mt-1 text-[12px] text-[#5c5a55]">{c.steps.length} message{c.steps.length > 1 ? "s" : ""}{c.stopOn.length ? " · stops when: " + c.stopOn.map((k) => TRIGGERS.find(([x]) => x === k)?.[1] || k).join(", ") : ""}{c.sales ? " · never messages anyone who has paid" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12.5px] text-[#4a4a59]">Sent <b>{c.stats.sent}</b> · Opened <b>{c.stats.opened}</b> ({pct(c.stats.opened, c.stats.sent)}) · Clicked <b>{c.stats.clicked}</b> · Acted <b>{c.stats.acted}</b></span>
          <Toggle on={en} onChange={async (v) => { setEn(v); await api("/api/growth", "POST", { action: "custom-flow-save", ...c, id: c.id, enabled: v }).catch((e) => toast((e as Error).message, "err")); reload(); }} />
        </div>
      </div>
      <ol className="mt-3 space-y-1.5 text-[13px]">{c.steps.map((s, i) => <li key={i} className="flex flex-wrap items-center gap-2 rounded-md bg-[#f4f2ed] px-3 py-2"><Pill tone={s.channel === "email" ? "blue" : "green"}>{s.channel}</Pill><span className="text-[#5c5a55]">{when(s.at)}</span><span className="min-w-0 flex-1 truncate">{s.channel === "email" ? <b>{s.subject}: </b> : null}{s.body}</span></li>)}</ol>
      <div className="mt-3 flex gap-2"><Btn variant="outline" onClick={onEdit}>Edit</Btn><Btn variant="danger" onClick={() => setDel(true)}>Delete</Btn></div>
      {del && <Confirm title="Delete this workflow?" text="People who are part-way through it will not get the remaining messages." onOk={async () => { await api("/api/growth", "POST", { action: "custom-flow-delete", id: c.id }); toast("Workflow deleted"); reload(); }} onClose={() => setDel(false)} />}
    </Panel>
  );
}

export default function GrowthFlows() {
  const [flows, setFlows] = useState<Flow[] | null>(null);
  const [custom, setCustom] = useState<CustomRow[]>([]);
  const [can, setCan] = useState<Can>({ edit: false, create: false, max: 0 });
  const [editing, setEditing] = useState<CustomRow | "new" | null>(null);
  const load = () => api<{ flows: Flow[]; custom: CustomRow[]; can: Can }>("/api/growth?q=flows").then((r) => { setFlows(r.flows); setCustom(r.custom || []); setCan(r.can); });
  useEffect(() => { load(); }, []);
  return (
    <div className="space-y-4">
      <Panel className="p-5">
        <Title sub="Each follows your real funnel, with a stop rule so nobody gets a sales message after they pay or book." right={<div className="flex gap-2"><Btn variant="outline" onClick={async () => { const r = await api<{ sent: number }>("/api/growth", "POST", { action: "run-due" }); toast(`${r.sent} message(s) sent`); load(); }}>Send due messages now</Btn><Btn icon="plus" disabled={!can.create || custom.length >= can.max} onClick={() => setEditing("new")}>New workflow</Btn></div>}>Workflows</Title>
        <div className="mt-3 space-y-2">
          {!can.create && <Note tone="yellow">Creating your own workflows and editing message wording are Pro features. On your current plan you can switch the ready-made workflows on or off.</Note>}
          {can.create && custom.length >= can.max && <Note tone="yellow">You have used all {can.max} custom workflows on your plan. Upgrade to add more.</Note>}
          <Note tone="blue">Messages are sent as soon as something happens. Timed ones (reminders, follow-ups) go out when the scheduler runs <code>/api/cron/run</code>, every few minutes in production. “Acted on” means the person reached the next step the message was asking for.</Note>
          <Note tone="yellow">WhatsApp only goes to people who ticked opt-in. Messages are sent through Meta&apos;s WhatsApp Cloud API when <code>WHATSAPP_TOKEN</code> is set (or Twilio when <code>TWILIO_WHATSAPP_FROM</code> is set); otherwise they are only logged.</Note>
        </div>
      </Panel>
      {custom.length > 0 && <div className="space-y-3"><p className="px-1 text-[13px] font-semibold uppercase tracking-wide text-[#5c5a55]">Your workflows</p>{custom.map((c) => <CustomCard key={c.id} c={c} reload={load} onEdit={() => setEditing(c)} />)}</div>}
      <p className="px-1 text-[13px] font-semibold uppercase tracking-wide text-[#5c5a55]">Ready-made workflows</p>
      {flows ? flows.map((f) => <FlowCard key={f.id} f={f} reload={load} canEdit={can.edit} />) : <div className="h-40 animate-pulse rounded-lg bg-white" />}
      {editing && <Editor flow={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={load} />}
    </div>
  );
}
