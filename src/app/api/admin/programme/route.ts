import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { deny, requireAdmin } from "@/lib/admin";
import { computeFunnel, stageOf, GROUPS, STEPS, type Lead } from "@/lib/growth/model";

const DAY = 864e5;

/** Platform-wide view of the Growth funnel: leads, learners, certificates and message delivery across every coach. */
export async function GET() {
  if (!(await requireAdmin())) return deny();
  type R = Record<string, unknown> & { id: string; userId: string; createdAt: string };
  const all = async (c: string) => (await store.find(c, [])) as unknown as R[];
  const [crm, enrols, certs, msgs, clicks, users] = await Promise.all([all("crm"), all("enrolments"), all("certIssues"), all("msgLog"), all("linkClicks"), all("users")]);
  const coach = new Map(users.map((u) => [u.id, String(u.name || u.email)]));
  const leads = crm as unknown as Lead[];
  const funnel = computeFunnel(leads, clicks as never);
  const since = Date.now() - 30 * DAY;
  const labels = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - (29 - i) * DAY).toISOString().slice(0, 10));
  const idx = new Map(labels.map((l, i) => [l, i]));
  const perDay = labels.map(() => 0);
  for (const l of leads) { const i = idx.get(String(l.createdAt).slice(0, 10)); if (i !== undefined) perDay[i]++; }

  const sent = msgs.filter((m) => m.sentAt);
  const byChannel = ["email", "whatsapp"].map((c) => ({ channel: c, sent: sent.filter((m) => m.channel === c).length, failed: msgs.filter((m) => m.channel === c && !m.sentAt && m.error).length }));
  const progress = (e: Record<string, unknown>) => (Array.isArray(e.lessonsDone) ? e.lessonsDone.length : 0);

  return NextResponse.json({
    totals: {
      leads: leads.length, leads30: leads.filter((l) => new Date(l.createdAt).getTime() >= since).length,
      paid: leads.filter((l) => l.m?.paid).length, learners: enrols.length, certificates: certs.length,
      messages: sent.length, failed: msgs.filter((m) => !m.sentAt && m.error).length, clicks: clicks.length,
    },
    funnel: { steps: funnel.steps, groups: GROUPS.map((g) => ({ key: g.key, label: g.label, count: funnel.groups[g.key] || 0 })), bySource: funnel.bySource },
    series: { labels, leads: perDay },
    byChannel,
    leads: leads.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 1000).map((l) => ({
      id: l.id, createdAt: l.createdAt, name: l.name, email: l.email, phone: l.phone, source: l.source || "direct",
      stage: stageOf(l), stageLabel: STEPS.find((s) => s.key === stageOf(l))?.label || "", coach: coach.get(l.userId) || "", coachId: l.userId,
      pattern: (l.pattern as { name?: string } | undefined)?.name || "", paid: Boolean(l.m?.paid),
    })),
    learners: enrols.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 1000).map((e) => ({
      id: e.id, createdAt: e.createdAt, name: String(e.name || ""), email: String(e.email || ""), phone: String(e.phone || ""), status: String(e.status || "active"),
      coach: coach.get(e.userId) || "", lessons: progress(e), attended: Array.isArray(e.attended) ? e.attended.length : 0, missed: Array.isArray(e.missed) ? e.missed.length : 0,
    })),
    certificates: certs.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 500).map((c) => ({
      id: c.id, code: String(c.code), name: String(c.name), email: String(c.email), title: String(c.title), course: String(c.course || ""), issuedAt: String(c.issuedAt), coach: coach.get(c.userId) || "",
    })),
  });
}
