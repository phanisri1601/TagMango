import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { deny, requireAdmin } from "@/lib/admin";

type R = Record<string, unknown> & { id: string; userId: string; createdAt: string };
const DAY = 864e5;

/** Who unsubscribed from whose emails, how fast it is growing, and which creators lose the most readers. */
export async function GET() {
  if (!(await requireAdmin())) return deny();
  const all = async (c: string) => (await store.find(c, [])) as unknown as R[];
  const [unsub, msgs, users, crm] = await Promise.all([all("unsubscribed"), all("msgLog"), all("users"), all("crm")]);
  const name = new Map(users.map((u) => [u.id, String(u.name)]));
  const sentBy = new Map<string, number>();
  for (const m of msgs) if (m.channel === "email" && m.sentAt) sentBy.set(m.userId, (sentBy.get(m.userId) || 0) + 1);
  const leadsBy = new Map<string, number>();
  for (const l of crm) leadsBy.set(l.userId, (leadsBy.get(l.userId) || 0) + 1);
  const unsubBy = new Map<string, number>();
  for (const u of unsub) unsubBy.set(u.userId, (unsubBy.get(u.userId) || 0) + 1);

  const labels = Array.from({ length: 30 }, (_, i) => new Date(Date.now() - (29 - i) * DAY).toISOString().slice(0, 10));
  const idx = new Map(labels.map((l, i) => [l, i]));
  const perDay = labels.map(() => 0);
  for (const u of unsub) { const i = idx.get(u.createdAt.slice(0, 10)); if (i !== undefined) perDay[i]++; }
  const sources = new Map<string, number>();
  for (const u of unsub) sources.set(String(u.source || "unknown"), (sources.get(String(u.source || "unknown")) || 0) + 1);
  const since30 = Date.now() - 30 * DAY;

  const creators = [...new Set([...unsubBy.keys(), ...sentBy.keys()])].map((id) => {
    const sent = sentBy.get(id) || 0, n = unsubBy.get(id) || 0;
    return { id, creator: name.get(id) || "(deleted)", sent, unsubscribed: n, leads: leadsBy.get(id) || 0, rate: sent ? Math.round((n / sent) * 10000) / 100 : 0 };
  }).sort((a, b) => b.unsubscribed - a.unsubscribed);

  return NextResponse.json({
    totals: { all: unsub.length, last30: unsub.filter((u) => new Date(u.createdAt).getTime() >= since30).length, emailsSent: [...sentBy.values()].reduce((a, b) => a + b, 0) },
    series: { labels, values: perDay },
    sources: [...sources.entries()].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
    creators,
    rows: unsub.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 500).map((u) => ({ id: u.id, email: String(u.email), creator: name.get(u.userId) || "(deleted)", source: String(u.source || "unknown"), createdAt: u.createdAt })),
  });
}
