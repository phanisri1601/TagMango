"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { copy, toast, useCollection, useMe, type Row } from "@/lib/client";
import { Btn, Confirm, EmptyBox, Modal, Panel, Pill, Title, Toggle, Walkthrough } from "@/components/dash/kit";
import { FormDrawer, type FieldDef } from "@/components/dash/forms";
import { Icon } from "@/components/dash/icons";
import { useMangoTitles } from "@/components/dash/hooks";
import { TEMPLATES, tpl, type Template } from "@/components/dash/templates";
import TemplatePreview from "@/components/dash/TemplatePreview";
import { isLocked, PLAN_LIMITS } from "@/components/dash/nav";

const Thumb = ({ t }: { t: Template }) => <TemplatePreview t={t} />;

function Inner() {
  const { me } = useMe();
  const col = useCollection("pages");
  const mangoes = useMangoTitles();
  const params = useSearchParams();
  const [preview, setPreview] = useState<Template | null>(null);
  const [edit, setEdit] = useState<Row | { template: string } | null>(null);
  const [del, setDel] = useState<Row | null>(null);
  const [filter, setFilter] = useState<"all" | "free" | "premium">("all");
  useEffect(() => { if (params.get("new") === "1") setEdit({ template: "paper" }); }, [params]);
  const premiumLocked = isLocked("premium-templates", me.plan);
  const max = PLAN_LIMITS[me.plan].pages;
  const full = col.rows.length >= max;

  const fields: FieldDef[] = [
    { key: "mango", label: "Mango", type: "select", options: mangoes, required: true, hint: mangoes.length ? undefined : "Create a mango first" },
    { key: "title", label: "Page title", required: true, maxLength: 80 },
    { key: "slug", label: "Page link", required: true, placeholder: "my-workshop", hint: "Your page will be live at /p/<link>" },
    { key: "template", label: "Design", type: "select", options: TEMPLATES.filter((t) => !t.premium || !premiumLocked).map((t) => t.id) },
    { key: "headline", label: "Headline", required: true, placeholder: "Learn X in 30 days" },
    { key: "subheadline", label: "Sub-headline", type: "textarea" },
    { key: "bullets", label: "What they'll get (one per line)", type: "textarea" },
    { key: "leadForm", label: "Collect leads (show a “Get details” form)", type: "toggle" },
    { key: "published", label: "Published", type: "toggle" },
  ];
  const shown = TEMPLATES.filter((t) => (filter === "all" ? true : filter === "premium" ? t.premium : !t.premium));

  return (
    <div className="space-y-5">
      <Walkthrough title="Create a mango page" />
      <Panel className="p-6">
        <Title sub="Pick a design, add your words, and publish a page that sells one mango. Each design has its own layout, not just its own colours." right={<div className="flex items-center gap-2"><span className="hidden text-[12.5px] text-[#5c5a55] sm:block">{col.rows.length} of {max >= 1e9 ? "unlimited" : max} pages</span><Btn icon="plus" disabled={full} onClick={() => setEdit({ template: "paper" })}>Create page</Btn></div>}>Mango Pages</Title>
        {full && <p className="mt-3 rounded-md bg-[#f4f2ed] px-3 py-2 text-[13px] text-[#5c5a55]">Your plan allows {max} pages. Upgrade your plan to add more.</p>}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          {([["all", "All designs"], ["free", "Free"], ["premium", "Premium"]] as const).map(([k, l]) => <button key={k} onClick={() => setFilter(k)} className={`rounded-full border px-4 py-1.5 text-[13px] transition ${filter === k ? "border-[#141413] bg-[#141413] text-white" : "border-[#d3cfc7] bg-white hover:border-[#141413]"}`}>{l}</button>)}
          {premiumLocked && <span className="ml-auto text-[12.5px] text-[#5c5a55]">Premium designs unlock on the Pro plan</span>}
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {shown.map((t) => {
            const locked = t.premium && premiumLocked;
            return (
              <div key={t.id} className="group relative flex flex-col rounded-[14px] border border-[#ededed] bg-white p-3 transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_44px_-24px_rgba(0,0,0,0.4)]">
                <div className="relative">
                  <Thumb t={t} />
                  <div className="absolute left-2 top-2 flex gap-1">{t.premium && <span className="rounded-full bg-[#141413] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">Premium</span>}{t.isNew && <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#141413] ring-1 ring-[#141413]/20">New</span>}</div>
                  <button onClick={() => setPreview(t)} className="absolute inset-0 grid place-items-center rounded-md bg-[#141413]/55 text-[13px] font-medium text-white opacity-0 backdrop-blur-[2px] transition group-hover:opacity-100">Preview design</button>
                </div>
                <div className="mt-3 flex-1 px-0.5"><p className="text-[15px] font-semibold">{t.name}</p><p className="text-[12.5px] leading-snug text-[#5c5a55]">{t.desc}</p></div>
                {locked ? (
                  <a href="/web/dashboard/plans" className="mt-3 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-[#bdb8ac] py-2 text-[13px] text-[#5c5a55] hover:border-[#141413] hover:text-[#141413]"><Icon name="lock" className="h-3.5 w-3.5" />Unlock with Pro</a>
                ) : (
                  <button disabled={full} onClick={() => setEdit({ template: t.id })} className="mt-3 rounded-md bg-[#141413] py-2.5 text-[13.5px] font-medium text-white transition hover:opacity-90 disabled:opacity-40">Use this design</button>
                )}
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel className="p-6" delay={0.06}>
        <Title sub="Your published and draft pages.">Your pages</Title>
        {col.rows.length === 0 && !col.loading ? <EmptyBox title="Create your first Mango Page" text="Choose a design above, add a headline and the benefits, and share the link." /> : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {col.rows.map((r) => (
              <div key={r.id} className="flex flex-col rounded-[14px] border border-[#ededed] p-3 transition hover:shadow-[0_14px_34px_-22px_rgba(0,0,0,0.4)]">
                <Thumb t={tpl(r.template)} />
                <div className="mt-3 flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-[15px] font-semibold">{String(r.title)}</p><p className="truncate text-[12.5px] text-[#5c5a55]">{String(r.mango)}</p></div><Pill tone={r.published ? "green" : "grey"}>{r.published ? "Live" : "Draft"}</Pill></div>
                <button className="mt-1 truncate text-left text-[12.5px] text-[#141413] underline-offset-2 hover:underline" onClick={() => copy(`${location.origin}/p/${r.slug}`, "Link")}>/p/{String(r.slug)}</button>
                <div className="mt-3 flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-[12.5px]"><Toggle on={Boolean(r.published)} onChange={async (v) => { await col.update(r.id, { published: v }); toast(v ? "Page published" : "Page unpublished"); }} label="Publish" />Publish</label>
                  <span className="ml-auto flex gap-1.5">
                    <a href={`/p/${r.slug}`} target="_blank" rel="noreferrer" className="rounded-md border border-[#e1e1e1] px-3 py-1.5 text-[12.5px] hover:border-[#141413]">Open</a>
                    <button onClick={() => setEdit(r)} className="rounded-md border border-[#e1e1e1] px-3 py-1.5 text-[12.5px] hover:border-[#141413]">Edit</button>
                    <button onClick={() => setDel(r)} className="rounded-md border border-[#f0c8c8] px-3 py-1.5 text-[12.5px] text-[#cf1322] hover:bg-[#fff2f0]">Delete</button>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {preview && (
        <Modal title={`${preview.name} design`} onClose={() => setPreview(null)} wide>
          <div className="mx-auto max-w-2xl"><TemplatePreview t={preview} title="How to Be Great" sub="A complete guide to better habits, with live sessions and feedback." /></div>
          <p className="mt-3 text-center text-[13px] text-[#5c5a55]">{preview.desc}</p>
        </Modal>
      )}
      {edit && (
        <FormDrawer
          title={"id" in edit ? "Edit mango page" : "Create mango page"}
          fields={fields}
          initial={{ published: true, ...edit }}
          submitLabel="Save"
          onClose={() => setEdit(null)}
          intro={<div className="max-w-[240px]"><Thumb t={tpl(edit.template)} /></div>}
          onSubmit={async (d) => {
            const slug = String(d.slug).toLowerCase().trim().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
            if (!slug) return "Enter a valid page link (letters, numbers and dashes)";
            const res = await fetch(`/api/data/pages`).then((r) => r.json());
            if ((res.rows as Row[]).some((p) => p.slug === slug && p.id !== ("id" in edit ? edit.id : ""))) return "That link is already used by another page";
            if ("id" in edit) await col.update(edit.id as string, { ...d, slug });
            else await col.create({ ...d, slug });
            toast("Mango page saved");
          }}
        />
      )}
      {del && <Confirm title="Delete mango page?" text="The public link will stop working." onOk={async () => { await col.remove(del.id); toast("Page deleted"); }} onClose={() => setDel(null)} />}
    </div>
  );
}

export default function Page() {
  return <Suspense><Inner /></Suspense>;
}
