"use client";
import { useState } from "react";
import { fmtDate, useCollection, type Row } from "@/lib/client";
import { Btn, Confirm, DataTable, Note, Panel, Pill, Title, type Col } from "@/components/dash/kit";
import { FormDrawer, type FieldDef } from "@/components/dash/forms";
import { origin } from "@/components/growth/shared";

const FIELDS: FieldDef[] = [
  { key: "title", label: "Title", required: true },
  { key: "slug", label: "Web address", required: true, hint: "Lowercase letters, numbers and dashes, e.g. why-patterns-repeat", placeholder: "my-first-article" },
  { key: "excerpt", label: "Short summary", type: "textarea", hint: "Shown on the blog list and the home page." },
  { key: "body", label: "Article", type: "textarea", hint: "Leave a blank line between paragraphs." },
  { key: "image", label: "Cover image link", type: "url", hint: "Upload to Cloud, then paste the link." },
  { key: "date", label: "Publish date", type: "date" },
  { key: "published", label: "Published", type: "toggle" },
];

export default function WebsiteBlog() {
  const col = useCollection("blogPosts");
  const [form, setForm] = useState<{ row?: Row } | null>(null);
  const [del, setDel] = useState<Row | null>(null);
  const cols: Col<Row>[] = [
    { key: "title", label: "Title", render: (r) => <span className="font-medium">{String(r.title)}</span> },
    { key: "slug", label: "Address", render: (r) => <a className="text-[#141413]" href={`/blog/${r.slug}`} target="_blank" rel="noreferrer">/blog/{String(r.slug)}</a> },
    { key: "date", label: "Date", render: (r) => fmtDate(String(r.date || r.createdAt)) },
    { key: "published", label: "Status", render: (r) => (r.published === false ? <Pill tone="orange">Draft</Pill> : <Pill>Published</Pill>) },
    { key: "act", label: "", render: (r) => <div className="flex gap-2"><Btn variant="outline" onClick={() => setForm({ row: r })}>Edit</Btn><Btn variant="danger" onClick={() => setDel(r)}>Delete</Btn></div> },
  ];
  return (
    <div className="space-y-4">
      <Panel className="p-5">
        <Title sub="Articles shown on your public website. Until you add one, three sample articles are shown." right={<Btn onClick={() => setForm({})}>New article</Btn>}>Website blog</Title>
        <div className="mt-3"><Note tone="blue">Your site: <code>{origin()}/blog</code>. Every article uses the same page template.</Note></div>
        <div className="mt-3"><DataTable cols={cols} rows={col.rows} loading={col.loading} empty={<p className="p-6 text-center text-[#6b6b7b]">No articles yet.</p>} /></div>
      </Panel>
      {form && (
        <FormDrawer
          title={form.row ? "Edit article" : "New article"}
          fields={FIELDS}
          initial={form.row ? form.row : { published: true, date: new Date().toISOString().slice(0, 10) }}
          onSubmit={async (d) => { if (form.row) await col.update(form.row.id, d); else await col.create(d); }}
          onClose={() => setForm(null)}
        />
      )}
      {del && <Confirm title="Delete this article?" text="This can't be undone." onOk={async () => { await col.remove(del.id); }} onClose={() => setDel(null)} />}
    </div>
  );
}
