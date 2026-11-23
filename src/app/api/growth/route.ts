import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { id as newId, now, store } from "@/lib/db";
import { activeLearners, alertCoach, appUrl, enrol, ensureGrowth, getGrowth, mark, processFlows, recordMiss } from "@/lib/growth/core";
import { FLOWS, GROUPS, MILESTONES, TRIGGERS, computeFunnel, type ClickRow, type Lead, type Milestone } from "@/lib/growth/model";
import { hasFeature, limitOf } from "@/lib/plans";
import { buildReport, weekStart } from "@/lib/growth/report";

const bad = (m: string, status = 400) => NextResponse.json({ error: m }, { status });

export async function GET(req: Request) {
  const me = await currentUser();
  if (!me) return bad("Not logged in", 401);
  const q = new URL(req.url).searchParams;
  const what = q.get("q") || "overview";
  const g = await ensureGrowth(me);

  if (what === "overview") {
    const [leads, clicks, links] = await Promise.all([store.find("crm", [["userId", me.id]]), store.find("linkClicks", [["userId", me.id]]), store.find("trackedLinks", [["userId", me.id]])]);
    const from = q.get("from") ? new Date(`${q.get("from")}T00:00:00+05:30`).toISOString() : undefined;
    const to = q.get("to") ? new Date(new Date(`${q.get("to")}T00:00:00+05:30`).getTime() + 864e5).toISOString() : undefined;
    const funnel = computeFunnel(leads as unknown as Lead[], clicks as unknown as ClickRow[], from, to);
    const byPlatform: Record<string, number> = {};
    for (const c of clicks) if (!from || String(c.createdAt) >= from) byPlatform[String(c.platform || "Other")] = (byPlatform[String(c.platform || "Other")] || 0) + 1;
    return NextResponse.json({ growth: g, funnel, clicksByPlatform: byPlatform, groups: GROUPS.map((x) => ({ key: x.key, label: x.label })), links: links.length, base: appUrl() });
  }

  if (what === "lead") {
    const lead = await store.get("crm", q.get("id") || "");
    if (!lead || lead.userId !== me.id) return bad("Not found", 404);
    const [msgs, mc, runs] = await Promise.all([
      store.find("msgLog", [["userId", me.id], ["leadId", lead.id]]),
      lead.masterclassId ? store.get("masterclasses", String(lead.masterclassId)) : null,
      store.find("flowRuns", [["userId", me.id], ["leadId", lead.id]]),
    ]);
    return NextResponse.json({ lead, masterclass: mc, messages: msgs.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 60), runs });
  }

  if (what === "flows") {
    const [docs, msgs] = await Promise.all([store.find("flows", [["userId", me.id]]), store.find("msgLog", [["userId", me.id]])]);
    const stat = (flowId: string, step?: string) => {
      const m = msgs.filter((x) => x.flowId === flowId && x.sentAt && (!step || x.stepKey === step));
      return { sent: m.length, opened: m.filter((x) => x.openedAt).length, clicked: m.filter((x) => x.clickedAt).length, acted: m.filter((x) => x.actedAt).length };
    };
    const custom = (await store.find("customFlows", [["userId", me.id]])).sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
    return NextResponse.json({
      flows: FLOWS.map((f) => {
        const d = docs.find((x) => x.flowId === f.id);
        return { ...f, enabled: d?.enabled !== false, overrides: d?.overrides || {}, stats: stat(f.id), stepStats: Object.fromEntries(f.steps.map((s) => [s.key, stat(f.id, s.key)])) };
      }),
      custom: custom.map((c) => {
        const id = `c_${c.id}`;
        const steps = ((c.steps as { channel: string; at: number }[]) || []);
        return { ...c, flowId: id, stats: stat(id), stepStats: Object.fromEntries(steps.map((_, i) => [`s${i + 1}`, stat(id, `s${i + 1}`)])) };
      }),
      can: { edit: hasFeature(me, "edit-workflows"), create: hasFeature(me, "custom-workflows"), max: limitOf(me, "customWorkflows") },
    });
  }

  if (what === "report" && !hasFeature(me, "growth-report")) return bad("Upgrade to Pro to see the weekly report", 403);
  if (what === "report") return NextResponse.json(await buildReport(me.id, q.get("week") || weekStart()));
  return bad("Unknown query");
}

const LEAD_ACTIONS: Record<string, Milestone[]> = {
  callAttended: ["callAttended"],
  callNoShow: ["callNoShow"],
  callDone: ["callAttended", "callDone"],
  declined: ["declined"],
  enrolStarted: ["enrolStarted"],
};

export async function POST(req: Request) {
  const me = await currentUser();
  if (!me) return bad("Not logged in", 401);
  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "ensure") return NextResponse.json({ growth: await ensureGrowth(me) });

  if (action === "lead-action") {
    const lead = await store.get("crm", String(body.leadId || ""));
    if (!lead || lead.userId !== me.id) return bad("Not found", 404);
    const a = String(body.what || "");
    if (a === "paid") {
      await enrol(me.id, lead as unknown as Lead);
      await mark(me.id, lead.id, "enrolStarted", { silent: true });
      await mark(me.id, lead.id, "paid");
    } else if (LEAD_ACTIONS[a]) {
      const keys = LEAD_ACTIONS[a];
      for (const k of keys) await mark(me.id, lead.id, k, { silent: k !== keys[keys.length - 1] });
    } else return bad("Unknown action");
    return NextResponse.json({ ok: true });
  }

  if (action === "mc-attendance") {
    const mc = await store.get("masterclasses", String(body.masterclassId || ""));
    if (!mc || mc.userId !== me.id) return bad("Not found", 404);
    const attended = new Set<string>((Array.isArray(body.attended) ? body.attended : []).map(String));
    const regs = await store.find("crm", [["userId", me.id], ["masterclassId", mc.id]]);
    let a = 0, m = 0;
    for (const l of regs) {
      if (attended.has(l.id)) {
        await mark(me.id, l.id, "mcAttended", { extra: { masterclassId: mc.id }, ctxKey: mc.id, refire: true });
        a++;
      } else if (!(l.m as Record<string, string> | undefined)?.mcAttended) {
        await mark(me.id, l.id, "mcMissed", { extra: { masterclassId: mc.id }, ctxKey: mc.id, refire: true });
        m++;
      }
    }
    await store.write([{ type: "update", coll: "masterclasses", id: mc.id, patch: { attendanceTaken: now() } }]);
    return NextResponse.json({ ok: true, attended: a, missed: m });
  }

  if (action === "class-attendance") {
    const cls = await store.get("classes", String(body.classId || ""));
    if (!cls || cls.userId !== me.id) return bad("Not found", 404);
    const present = new Set<string>((Array.isArray(body.present) ? body.present : []).map(String));
    for (const e of await store.find("enrolments", [["userId", me.id]])) {
      const att = new Set<string>((e.attended as string[]) || []);
      if (present.has(e.id)) {
        att.add(cls.id);
        await store.write([{ type: "update", coll: "enrolments", id: e.id, patch: { attended: [...att] } }]);
      } else if (!att.has(cls.id)) await recordMiss(me.id, e.id, "class", cls.id);
    }
    await store.write([{ type: "update", coll: "classes", id: cls.id, patch: { attendanceTaken: now() } }]);
    return NextResponse.json({ ok: true });
  }

  if (action === "flow-save") {
    const flowId = String(body.flowId || "");
    const def = FLOWS.find((f) => f.id === flowId);
    if (!def) return bad("Unknown workflow");
    const ov: Record<string, { subject?: string; body?: string; off?: boolean }> = {};
    for (const s of def.steps) {
      const o = (body.overrides || {})[s.key] || {};
      const r: { subject?: string; body?: string; off?: boolean } = {};
      if (typeof o.subject === "string" && o.subject.trim() && o.subject !== s.subject) r.subject = o.subject.slice(0, 200);
      if (typeof o.body === "string" && o.body.trim() && o.body !== s.body) r.body = o.body.slice(0, 5000);
      if (o.off) r.off = true;
      if (Object.keys(r).length) ov[s.key] = r;
    }
    const [cur] = await store.find("flows", [["userId", me.id], ["flowId", flowId]], { limit: 1 });
    if (Object.keys(ov).length && !hasFeature(me, "edit-workflows")) return bad("Editing workflow messages is a Pro feature. You can still switch workflows on or off.", 403);
    const data = { enabled: body.enabled !== false, overrides: ov };
    if (cur) await store.write([{ type: "update", coll: "flows", id: cur.id, patch: data }]);
    else await store.write([{ type: "set", coll: "flows", id: newId(), data: { userId: me.id, createdAt: now(), flowId, ...data } }]);
    return NextResponse.json({ ok: true });
  }

  if (action === "custom-flow-save") {
    if (!hasFeature(me, "custom-workflows")) return bad("Creating your own workflows is a Pro feature. Upgrade your plan.", 403);
    const name = String(body.name || "").trim().slice(0, 60);
    if (!name) return bad("Give the workflow a name");
    const trigger = String(body.trigger || "") as Milestone;
    if (!TRIGGERS.some(([k]) => k === trigger)) return bad("Choose when the workflow starts");
    const steps = (Array.isArray(body.steps) ? body.steps : []).slice(0, 10).map((s: Record<string, unknown>) => ({
      channel: s.channel === "whatsapp" ? "whatsapp" : "email",
      at: Math.min(60 * 1440, Math.max(0, Math.round(Number(s.at) || 0))),
      subject: String(s.subject || "").slice(0, 200),
      body: String(s.body || "").trim().slice(0, 3000),
    }));
    if (!steps.length) return bad("Add at least one message");
    if (steps.some((s: { body: string }) => !s.body)) return bad("Every message needs some text");
    if (steps.some((s: { channel: string; subject: string }) => s.channel === "email" && !s.subject.trim())) return bad("Every email needs a subject");
    const stopOn = (Array.isArray(body.stopOn) ? body.stopOn : []).map(String).filter((k: string) => (MILESTONES as readonly string[]).includes(k));
    const goal = (MILESTONES as readonly string[]).includes(String(body.goal)) ? String(body.goal) : null;
    const data = { name, trigger, steps, stopOn, goal, sales: !!body.sales, enabled: body.enabled !== false };
    if (body.id) {
      const cur = await store.get("customFlows", String(body.id));
      if (!cur || cur.userId !== me.id) return bad("Workflow not found", 404);
      await store.write([{ type: "update", coll: "customFlows", id: cur.id, patch: data }]);
      return NextResponse.json({ ok: true, id: cur.id });
    }
    const have = (await store.find("customFlows", [["userId", me.id]])).length;
    if (have >= limitOf(me, "customWorkflows")) return bad(`Your plan allows up to ${limitOf(me, "customWorkflows")} custom workflows. Upgrade to add more.`, 403);
    const id = newId();
    await store.write([{ type: "set", coll: "customFlows", id, data: { userId: me.id, createdAt: now(), ...data } }]);
    return NextResponse.json({ ok: true, id });
  }

  if (action === "custom-flow-delete") {
    const cur = await store.get("customFlows", String(body.id || ""));
    if (!cur || cur.userId !== me.id) return bad("Workflow not found", 404);
    await store.write([{ type: "delete", coll: "customFlows", id: cur.id }]);
    return NextResponse.json({ ok: true });
  }

  if (action === "run-due") return NextResponse.json({ ok: true, sent: await processFlows() });

  if (action === "rotate-hook") {
    const g = await ensureGrowth(me);
    const key = newId() + newId();
    await store.write([{ type: "update", coll: "growth", id: g.id, patch: { hookKey: key } }]);
    return NextResponse.json({ ok: true, hookKey: key });
  }

  if (action === "test-alert") {
    await alertCoach(me.id, "Test alert: your lead alerts are working.");
    return NextResponse.json({ ok: true });
  }

  if (action === "learners") return NextResponse.json({ learners: (await activeLearners(me.id)).map((l) => ({ id: l.id, name: l.name, email: l.email, lessonsDone: l.lessonsDone || [], attended: l.attended || [], missed: l.missed || [] })) });
  void getGrowth;
  return bad("Unknown action");
}
