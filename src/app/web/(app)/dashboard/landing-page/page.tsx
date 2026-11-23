"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { copy, toast, useCollection, type Row } from "@/lib/client";
import { Btn, Confirm, EmptyBox, Field, Gate, Modal, Panel, Pill, RowAction, Title, Toggle, areaCls, inputCls } from "@/components/dash/kit";
import { Icon } from "@/components/dash/icons";
import MediaField from "@/components/dash/MediaField";
import SiteRender from "@/components/dash/SiteRender";
import { BLOCK_DEFS, BLOCK_KINDS, STARTERS, newBlock, type Block, type BlockKind, type SiteSeo, type SiteTheme, type Tone } from "@/components/dash/siteBlocks";

const SWATCHES = [["#141413", "Ink"], ["#5c5a55", "Graphite"], ["#171716", "Dark"], ["#e9e6e0", "Mist"]];
const DEVICES = [["Desktop", 1100], ["Tablet", 768], ["Phone", 390]] as const;

/** A live miniature of a website, scaled to its card. */
function Mini({ blocks, color, theme, ratio = "aspect-[16/11]" }: { blocks: Block[]; color: string; theme?: SiteTheme; ratio?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(300);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    setW(el.clientWidth);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className={`pointer-events-none relative w-full overflow-hidden rounded-md border border-[#ededed] bg-white ${ratio}`}>
      <div style={{ width: 1100, transform: `scale(${w / 1100})`, transformOrigin: "top left" }}><SiteRender blocks={blocks} color={color} theme={theme} /></div>
    </div>
  );
}

function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-md border border-[#e1e1e1]">
      {options.map(([v, l]) => <button key={v} type="button" onClick={() => onChange(v)} className={`px-3 py-1.5 text-[12.5px] transition ${value === v ? "bg-[#141413] text-white" : "bg-white hover:bg-[#f4f2ed]"}`}>{l}</button>)}
    </div>
  );
}

/** Rows instead of "one per line" text: each item has its own boxes. */
function Items({ value, labels, onChange, add }: { value: string; labels: string[]; onChange: (v: string) => void; add: string }) {
  const rows = (value || "").split("\n").filter((x) => x.trim() !== "" || false).map((r) => r.split("|"));
  const write = (rs: string[][]) => onChange(rs.map((r) => r.map((c) => c.replace(/[|\n]/g, " ")).join("|")).join("\n"));
  const set = (i: number, j: number, v: string) => write(rows.map((r, k) => (k === i ? Array.from({ length: labels.length }, (_, c) => (c === j ? v : r[c] || "")) : r)));
  const mv = (i: number, d: number) => { const a = [...rows]; const t = i + d; if (t < 0 || t >= a.length) return; [a[i], a[t]] = [a[t], a[i]]; write(a); };
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="rounded-md border border-[#ededed] bg-[#fafaf9] p-2">
          <div className="space-y-1.5">{labels.map((l, j) => (j === 0 && labels.length > 1 && labels[1] === "Answer" ) || l === "Answer" || l === "Description" || l === "Quote" ? <textarea key={j} className={`${areaCls} min-h-14 text-[13px]`} placeholder={l} value={r[j] || ""} onChange={(e) => set(i, j, e.target.value)} /> : <input key={j} className={`${inputCls} !h-9 text-[13px]`} placeholder={l} value={r[j] || ""} onChange={(e) => set(i, j, e.target.value)} />)}</div>
          <div className="mt-1.5 flex gap-3 text-[12px] text-[#5c5a55]"><button onClick={() => mv(i, -1)}>↑ Up</button><button onClick={() => mv(i, 1)}>↓ Down</button><button className="ml-auto text-[#cf1322]" onClick={() => write(rows.filter((_, k) => k !== i))}>Remove</button></div>
        </div>
      ))}
      <button type="button" onClick={() => write([...rows, labels.map(() => "")])} className="w-full rounded-md border border-dashed border-[#bdb8ac] py-2 text-[13px] hover:border-[#141413]">+ {add}</button>
    </div>
  );
}

const ITEM_FIELDS: Partial<Record<BlockKind, { labels: string[]; add: string; title: string }>> = {
  features: { labels: ["Title", "Description"], add: "Add a benefit", title: "Benefits" },
  steps: { labels: ["Title", "Description"], add: "Add a step", title: "Steps" },
  stats: { labels: ["Number", "Label"], add: "Add a number", title: "Numbers" },
  faq: { labels: ["Question", "Answer"], add: "Add a question", title: "Questions" },
  testimonial: { labels: ["Quote", "Name", "Role"], add: "Add a testimonial", title: "Testimonials" },
  offer: { labels: ["Included"], add: "Add an item", title: "What is included" },
};
const TONES: [Tone, string][] = [["light", "Light"], ["mist", "Soft"], ["dark", "Dark"], ["brand", "Brand"]];

function Editor({ block, onChange, onDelete }: { block: Block; onChange: (p: Partial<Block>) => void; onDelete: () => void }) {
  const k = block.kind;
  const items = ITEM_FIELDS[k];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><p className="text-[15px] font-semibold">{BLOCK_DEFS[k].label}</p><button className="text-[12px] text-[#cf1322]" onClick={onDelete}>Delete section</button></div>
      {k === "hero" && <Field label="Small label above the heading"><input className={inputCls} value={block.meta || ""} onChange={(e) => onChange({ meta: e.target.value })} /></Field>}
      {k !== "stats" && k !== "image" && <Field label={k === "hero" ? "Heading" : "Title"}><input className={inputCls} value={block.title || ""} onChange={(e) => onChange({ title: e.target.value })} /></Field>}
      {k === "offer" && <Field label="Price" hint="Shown large, e.g. ₹75,000"><input className={inputCls} value={block.meta || ""} onChange={(e) => onChange({ meta: e.target.value })} /></Field>}
      {(k === "hero" || k === "features" || k === "text" || k === "offer" || k === "cta") && <Field label="Text"><textarea className={`${areaCls} min-h-24`} value={block.body || ""} onChange={(e) => onChange({ body: e.target.value })} /></Field>}
      {k === "image" && <><Field label="Picture"><MediaField kind="image" value={block.image || ""} onChange={(v) => onChange({ image: v })} /></Field><Field label="Caption (optional)"><input className={inputCls} value={block.body || ""} onChange={(e) => onChange({ body: e.target.value })} /></Field></>}
      {k === "hero" && <Field label="Photo (optional)" hint="Shown beside the heading, or under it when centred."><MediaField kind="image" value={block.image || ""} onChange={(v) => onChange({ image: v })} /></Field>}
      {k === "video" && <Field label="Video" hint="Upload a video or paste a YouTube or Vimeo link."><MediaField kind="video" value={block.link || ""} onChange={(v) => onChange({ link: v })} /></Field>}
      {items && <Field label={items.title}><Items value={block.items || ""} labels={items.labels} add={items.add} onChange={(v) => onChange({ items: v })} /></Field>}
      {(k === "hero" || k === "offer" || k === "cta") && (
        <>
          <Field label="Button text"><input className={inputCls} value={block.button || ""} onChange={(e) => onChange({ button: e.target.value })} /></Field>
          <Field label="Button link" hint="A checkout, Mango Page or booking link."><input className={inputCls} placeholder="https://…" value={block.link || ""} onChange={(e) => onChange({ link: e.target.value })} /></Field>
        </>
      )}
      {(k === "hero" || k === "text" || k === "features" || k === "faq" || k === "testimonial") && (
        <Field label="Alignment"><Seg value={block.align || (k === "hero" ? "center" : "left")} options={[["left", "Left"], ["center", "Centre"]]} onChange={(v) => onChange({ align: v })} /></Field>
      )}
      <Field label="Background"><Seg value={block.tone || "light"} options={TONES} onChange={(v) => onChange({ tone: v })} /></Field>
    </div>
  );
}

function Builder({ site, onBack }: { site: Row; onBack: () => void }) {
  const col = useCollection("sites");
  const [blocks, setBlocks] = useState<Block[]>((site.blocks as Block[]) || []);
  const [name, setName] = useState(String(site.name));
  const [color, setColor] = useState(String(site.color || "#141413"));
  const [theme, setTheme] = useState<SiteTheme>((site.theme as SiteTheme) || { font: "serif", radius: "soft" });
  const [seo, setSeo] = useState<SiteSeo>((site.seo as SiteSeo) || {});
  const [sel, setSel] = useState<string | null>(blocks[0]?.id || null);
  const [tab, setTab] = useState<"section" | "design" | "settings">("section");
  const [device, setDevice] = useState<number>(1100);
  const [adding, setAdding] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const [saved, setSaved] = useState(() => JSON.stringify({ name: String(site.name), color: String(site.color || "#141413"), blocks: site.blocks || [], theme: site.theme || { font: "serif", radius: "soft" }, seo: site.seo || {} }));
  const snapshot = JSON.stringify({ name, color, blocks, theme, seo });
  const dirty = snapshot !== saved;
  const cur = blocks.find((b) => b.id === sel);
  const wrap = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(700);
  useEffect(() => { const el = wrap.current; if (!el) return; const ro = new ResizeObserver(() => setCw(el.clientWidth)); setCw(el.clientWidth); ro.observe(el); return () => ro.disconnect(); }, []);
  useEffect(() => { if (!dirty) return; const h = (e: BeforeUnloadEvent) => { e.preventDefault(); }; window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h); }, [dirty]);
  const frame = Math.min(device, cw - 8);
  const zoom = device > cw - 8 ? (cw - 8) / device : 1;

  const upd = (patch: Partial<Block>) => setBlocks((bs) => bs.map((b) => (b.id === sel ? { ...b, ...patch } : b)));
  const add = (kind: BlockKind) => { const nb = newBlock(kind); setBlocks((bs) => [...bs, nb]); setSel(nb.id); setTab("section"); setAdding(false); setTimeout(() => document.getElementById(`s-${nb.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 80); };
  const dup = (i: number) => setBlocks((bs) => { const a = [...bs]; a.splice(i + 1, 0, { ...bs[i], id: crypto.randomUUID() }); return a; });
  const drop = (to: number) => { if (drag === null || drag === to) return setDrag(null); setBlocks((bs) => { const a = [...bs]; const [m] = a.splice(drag, 1); a.splice(to, 0, m); return a; }); setDrag(null); };
  const save = async () => { await col.update(site.id, { name, color, blocks, theme, seo }); setSaved(snapshot); toast("Website saved"); };
  const link = useMemo(() => `/site/${site.slug}`, [site.slug]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => { if (!dirty || confirm("You have unsaved changes. Leave without saving?")) onBack(); }} className="grid h-9 w-9 place-items-center rounded-md border border-[#e1e1e1] bg-white" aria-label="Back"><Icon name="chevron" className="h-4 w-4 rotate-90" /></button>
        <input className="h-9 min-w-[160px] flex-1 rounded-md border border-transparent bg-transparent px-2 text-[19px] font-semibold outline-none focus:border-[#e1e1e1] focus:bg-white" value={name} onChange={(e) => setName(e.target.value)} aria-label="Website name" />
        <div className="hidden items-center gap-1 rounded-md border border-[#e1e1e1] bg-white p-0.5 md:flex">{DEVICES.map(([l, w]) => <button key={l} onClick={() => setDevice(w)} className={`rounded px-3 py-1.5 text-[12.5px] ${device === w ? "bg-[#141413] text-white" : "hover:bg-[#f4f2ed]"}`}>{l}</button>)}</div>
        {dirty ? <Pill tone="orange">Unsaved changes</Pill> : <span className="text-[12.5px] text-[#5c5a55]">All changes saved</span>}
        <label className="flex items-center gap-1.5 text-[13px]"><Toggle on={Boolean(site.published)} onChange={async (v) => { await col.update(site.id, { published: v }); toast(v ? "Website is live" : "Website unpublished"); }} />{site.published ? "Live" : "Draft"}</label>
        <a href={link} target="_blank" rel="noreferrer"><Btn variant="outline" icon="eye">View</Btn></a>
        <Btn onClick={save} disabled={!dirty}>Save</Btn>
      </div>

      <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)_310px]">
        <Panel className="h-fit p-3">
          <div className="flex items-center justify-between px-1 pb-2"><p className="text-[12px] font-semibold uppercase tracking-wide text-[#5c5a55]">Sections</p><span className="text-[12px] text-[#5c5a55]">{blocks.length}</span></div>
          {blocks.map((b, i) => (
            <div key={b.id} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => drop(i)} onDragEnd={() => setDrag(null)}
              className={`group mb-1 flex items-center gap-1.5 rounded-md border px-2 py-2 text-[13px] ${sel === b.id ? "border-[#141413] bg-[#f4f2ed]" : "border-transparent hover:bg-[#f7f7f7]"} ${drag === i ? "opacity-40" : ""}`}>
              <span className="cursor-grab select-none text-[#9b9bab]" title="Drag to reorder">⋮⋮</span>
              <button className="min-w-0 flex-1 text-left" onClick={() => { setSel(b.id); setTab("section"); document.getElementById(`s-${b.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}>
                <b className="block truncate font-medium">{BLOCK_DEFS[b.kind].label}</b><span className="block truncate text-[11.5px] text-[#5c5a55]">{b.title || b.body || b.items?.split("\n")[0]?.split("|")[0] || ""}</span>
              </button>
              <span className="hidden gap-1.5 text-[12px] text-[#5c5a55] group-hover:flex"><button title="Duplicate" onClick={() => dup(i)}>⧉</button><button title="Delete" className="text-[#cf1322]" onClick={() => { setBlocks((bs) => bs.filter((x) => x.id !== b.id)); if (sel === b.id) setSel(null); }}>✕</button></span>
            </div>
          ))}
          <button onClick={() => setAdding(true)} className="mt-2 w-full rounded-md bg-[#141413] py-2.5 text-[13px] font-medium text-white">+ Add section</button>
        </Panel>

        <div ref={wrap} className="min-w-0 rounded-[10px] border border-[#e1e1e1] bg-[#e9e6e0] p-2">
          <div className="mx-auto overflow-hidden bg-white shadow-[0_20px_50px_-25px_rgba(0,0,0,0.45)]" style={{ width: frame, borderRadius: device < 1100 ? 18 : 6 }}>
            <div className="max-h-[76vh] overflow-y-auto">
              <div style={{ width: device, zoom }}><SiteRender blocks={blocks} color={color} name={name} theme={theme} selected={sel} onSelect={(id) => { setSel(id); setTab("section"); }} /></div>
            </div>
          </div>
        </div>

        <Panel className="h-fit p-4">
          <div className="mb-4 flex gap-1 border-b border-[#ededed]">
            {(["section", "design", "settings"] as const).map((t) => <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-3 pb-2 text-[13px] capitalize ${tab === t ? "border-[#141413] font-semibold" : "border-transparent text-[#5c5a55]"}`}>{t}</button>)}
          </div>
          {tab === "section" && (cur ? <Editor block={cur} onChange={upd} onDelete={() => { setBlocks((bs) => bs.filter((x) => x.id !== cur.id)); setSel(null); }} /> : <p className="py-8 text-center text-[13px] text-[#5c5a55]">Click a section in the preview, or pick one on the left, to edit it.</p>)}
          {tab === "design" && (
            <div className="space-y-4">
              <Field label="Brand colour" hint="Used for buttons, numbers and “Brand” backgrounds.">
                <div className="flex flex-wrap items-center gap-2">
                  {SWATCHES.map(([c, n]) => <button key={c} title={n} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full border-2 ${color.toLowerCase() === c ? "border-[#2563eb]" : "border-[#d3cfc7]"}`} style={{ background: c }} />)}
                  <input type="color" aria-label="Custom colour" className="h-8 w-10 rounded border border-[#e1e1e1] p-0.5" value={color} onChange={(e) => setColor(e.target.value)} />
                </div>
              </Field>
              <Field label="Typeface"><Seg value={theme.font || "serif"} options={[["serif", "Elegant (serif)"], ["sans", "Modern (sans)"]]} onChange={(v) => setTheme({ ...theme, font: v })} /></Field>
              <Field label="Corners"><Seg value={theme.radius || "soft"} options={[["soft", "Soft"], ["sharp", "Sharp"]]} onChange={(v) => setTheme({ ...theme, radius: v })} /></Field>
            </div>
          )}
          {tab === "settings" && (
            <div className="space-y-4">
              <Field label="Page title for Google" hint="Up to 60 characters."><input className={inputCls} maxLength={60} value={seo.title || ""} placeholder={name} onChange={(e) => setSeo({ ...seo, title: e.target.value })} /></Field>
              <Field label="Short description for Google" hint="Up to 160 characters."><textarea className={`${areaCls} min-h-20`} maxLength={160} value={seo.description || ""} onChange={(e) => setSeo({ ...seo, description: e.target.value })} /></Field>
              <Field label="Website address"><div className="flex gap-2"><input readOnly className={inputCls} value={typeof window === "undefined" ? link : `${location.origin}${link}`} /><Btn variant="outline" onClick={() => copy(`${location.origin}${link}`, "Link")}>Copy</Btn></div></Field>
            </div>
          )}
        </Panel>
      </div>

      {adding && (
        <Modal title="Add a section" onClose={() => setAdding(false)} wide>
          <div className="grid gap-3 sm:grid-cols-2">
            {BLOCK_KINDS.map((k) => (
              <button key={k} onClick={() => add(k)} className="rounded-lg border border-[#ededed] p-3 text-left transition hover:border-[#141413] hover:shadow-md">
                <Mini blocks={[{ ...newBlock(k) }]} color={color} theme={theme} ratio="aspect-[16/8]" />
                <p className="mt-2 text-[14px] font-semibold">{BLOCK_DEFS[k].label}</p><p className="text-[12.5px] text-[#5c5a55]">{BLOCK_DEFS[k].desc}</p>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Sites() {
  const col = useCollection("sites");
  const [open, setOpen] = useState<Row | null>(null);
  const [del, setDel] = useState<Row | null>(null);
  const [starting, setStarting] = useState(false);
  if (open) return <Builder site={col.rows.find((r) => r.id === open.id) || open} onBack={() => setOpen(null)} />;
  return (
    <Panel className="p-5">
      <Title sub="Build a multi-section website, see it on desktop, tablet and phone, and publish it on its own link." right={<Btn icon="plus" onClick={() => setStarting(true)}>Create website</Btn>}>Website Builder</Title>
      {col.rows.length === 0 && !col.loading ? <EmptyBox title="No websites yet" text="Start from a ready-made design and change the words, pictures and colours." /> : (
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {col.rows.map((s) => (
            <div key={s.id} className="rounded-[12px] border border-[#ededed] p-3 transition hover:shadow-[0_14px_34px_-20px_rgba(0,0,0,0.35)]">
              <Mini blocks={(s.blocks as Block[]) || []} color={String(s.color || "#141413")} theme={s.theme as SiteTheme} />
              <div className="mt-3 flex items-center justify-between"><p className="font-semibold">{String(s.name)}</p><Pill tone={s.published ? "green" : "grey"}>{s.published ? "Live" : "Draft"}</Pill></div>
              <p className="text-[12px] text-[#5c5a55]">/site/{String(s.slug)}</p>
              <div className="mt-3 flex items-center gap-1.5">
                <Btn className="h-8 px-3 text-[13px]" onClick={() => setOpen(s)}>Edit</Btn>
                <label className="flex items-center gap-1.5 text-[12px]"><Toggle on={Boolean(s.published)} onChange={async (v) => { await col.update(s.id, { published: v }); toast(v ? "Website published" : "Website unpublished"); }} />Publish</label>
                <span className="ml-auto flex gap-1.5"><RowAction icon="link" title="Copy link" onClick={() => copy(`${location.origin}/site/${s.slug}`)} /><RowAction icon="trash" title="Delete" danger onClick={() => setDel(s)} /></span>
              </div>
            </div>
          ))}
        </div>
      )}
      {starting && (
        <Modal title="Choose a starting point" onClose={() => setStarting(false)} wide>
          <div className="grid gap-4 sm:grid-cols-2">
            {STARTERS.map((st) => (
              <button key={st.id} onClick={async () => {
                const slug = `site-${Math.random().toString(36).slice(2, 7)}`;
                const row = await col.create({ name: st.name === "Simple page" ? "My page" : "My website", slug, color: "#141413", published: false, theme: st.theme, seo: {}, blocks: st.blocks() });
                setStarting(false);
                setOpen(row);
              }} className="rounded-lg border border-[#ededed] p-3 text-left transition hover:border-[#141413] hover:shadow-md">
                <Mini blocks={st.blocks().slice(0, 4)} color="#141413" theme={st.theme} />
                <p className="mt-2 text-[15px] font-semibold">{st.name}</p><p className="text-[12.5px] text-[#5c5a55]">{st.desc}</p>
              </button>
            ))}
          </div>
        </Modal>
      )}
      {del && <Confirm title="Delete website?" text="Its public link will stop working." onOk={async () => { await col.remove(del.id); toast("Website deleted"); }} onClose={() => setDel(null)} />}
    </Panel>
  );
}

export default function Page() {
  return <Gate feature="landing-page" title="Website Builder"><Sites /></Gate>;
}
