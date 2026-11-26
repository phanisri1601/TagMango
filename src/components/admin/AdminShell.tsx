"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MeContext, api, type Me } from "@/lib/client";
import { useAdminData } from "@/lib/adminClient";
import { Icon } from "@/components/dash/icons";
import Toaster from "@/components/dash/Toaster";
import { Logo } from "@/components/ui";

const GROUPS: { title: string; items: { href: string; label: string; icon: string; badge?: "kyc" | "withdrawals" | "reports" }[] }[] = [
  { title: "Platform", items: [
    { href: "/admin", label: "Overview", icon: "analytics" },
    { href: "/admin/creators", label: "Creators", icon: "customers" },
  ] },
  { title: "Programme", items: [
    { href: "/admin/leads", label: "Leads & funnel", icon: "analytics" },
    { href: "/admin/learners", label: "Learners & certificates", icon: "star" },
    { href: "/admin/unsubscribes", label: "Unsubscribes", icon: "bell" },
  ] },
  { title: "Money", items: [
    { href: "/admin/orders", label: "Orders", icon: "sales" },
    { href: "/admin/billing", label: "Plans & invoices", icon: "billing" },
    { href: "/admin/withdrawals", label: "Withdrawals", icon: "download", badge: "withdrawals" },
  ] },
  { title: "Trust and safety", items: [
    { href: "/admin/kyc", label: "KYC reviews", icon: "check", badge: "kyc" },
    { href: "/admin/reports", label: "Reports", icon: "warning", badge: "reports" },
    { href: "/admin/audit", label: "Audit log", icon: "eye" },
  ] },
  { title: "System", items: [
    { href: "/admin/announcements", label: "Announcements", icon: "bell" },
    { href: "/admin/health", label: "System health", icon: "check" },
    { href: "/admin/settings", label: "Settings", icon: "settings" },
  ] },
];
const NAV = GROUPS.flatMap((g) => g.items);

type Hit = { type: string; label: string; sub: string; href: string };

/** One box that finds creators, orders, leads and learners by name, email or phone. */
function GlobalSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (q.trim().length < 2) { setHits(null); return; }
    const t = setTimeout(() => { api<{ results: Hit[] }>(`/api/admin/search?q=${encodeURIComponent(q.trim())}`).then((r) => setHits(r.results)).catch(() => setHits([])); }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="relative w-full max-w-[460px]">
      <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); (e.target as HTMLInputElement).blur(); } }} placeholder="Search creators, orders, leads or learners by name, email or phone" aria-label="Search the admin panel" className="h-9 w-full rounded-lg border border-[#e1e1e1] bg-[#f7f7f8] px-3.5 text-[13px] outline-none transition focus:border-[#141413] focus:bg-white" />
      {open && hits && (
        <div className="absolute left-0 right-0 top-11 z-50 max-h-[420px] overflow-y-auto rounded-xl border border-[#e1e1e1] bg-white p-1.5 shadow-xl">
          {hits.length === 0 ? <p className="px-3 py-4 text-center text-[13px] text-[#6b6b7b]">Nothing found for &ldquo;{q}&rdquo;</p> : hits.map((h, i) => (
            <button key={i} onMouseDown={(e) => { e.preventDefault(); setOpen(false); setQ(""); router.push(h.href); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition hover:bg-[#f4f2ed]">
              <span className="w-[60px] shrink-0 rounded bg-[#141413] px-1.5 py-0.5 text-center text-[10px] font-semibold uppercase tracking-wider text-white">{h.type}</span>
              <span className="min-w-0"><b className="block truncate text-[13.5px]">{h.label}</b><span className="block truncate text-[12px] text-[#6b6b7b]">{h.sub}</span></span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({ me, open, onClose }: { me: Me; open: boolean; onClose: () => void }) {
  const path = usePathname();
  const router = useRouter();
  const counts = useAdminData<{ withdrawals: number; reports: number; kyc: number }>("/api/admin/counts");
  useEffect(() => {
    const t = setInterval(counts.reload, 30000);
    return () => clearInterval(t);
  }, [counts.reload]);

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col bg-[#0f0f10] text-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-[64px] items-center gap-2.5 border-b border-white/10 px-5">
          <Logo href="/admin" imageClassName="w-[112px]" />
          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#141413]">ADMIN</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-4">
              <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/35">{g.title}</p>
              <div className="space-y-0.5">
                {g.items.map((n) => {
                  const active = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
                  const count = n.badge ? counts.data?.[n.badge] || 0 : 0;
                  return (
                    <Link key={n.href} href={n.href} onClick={onClose} className={`relative flex h-9 items-center gap-3 rounded-lg px-3 text-[13.5px] transition-colors ${active ? "bg-white text-[#141413] font-medium" : "text-white/65 hover:bg-white/8 hover:text-white"}`}>
                      <Icon name={n.icon} className="h-[17px] w-[17px]" />
                      <span className="flex-1 truncate">{n.label}</span>
                      {count > 0 && <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold ${active ? "bg-[#141413] text-white" : "bg-white text-[#141413]"}`}>{count}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-white/10 p-4">
          <p className="truncate text-[13px] font-medium">{me.name}</p>
          <p className="truncate text-[12px] text-white/50">{me.email}</p>
          <div className="mt-3 flex gap-2">
            <Link href="/web/dashboard/getstarted" className="flex-1 rounded-md bg-white/10 py-2 text-center text-[12px] transition hover:bg-white/15">Creator view</Link>
            <button
              className="flex-1 rounded-md bg-white/10 py-2 text-[12px] transition hover:bg-white/15"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                router.push("/admin/login");
                router.refresh();
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [me, setMeRaw] = useState<Me | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    api<{ user: Me }>("/api/me").then((r) => setMeRaw(r.user)).catch(() => {});
  }, []);

  if (!me) {
    return (
      <div className="font-app grid min-h-screen place-items-center bg-[#f5f5f7]">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#e9e6e0] border-t-[#141413]" />
      </div>
    );
  }

  if (!me.isAdmin) {
    return (
      <div className="font-app grid min-h-screen place-items-center bg-[#f5f5f7] p-6 text-center">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-black/5">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#fff2f0] text-[#cf1322]"><Icon name="lock" className="h-7 w-7" /></span>
          <h1 className="mt-4 text-[22px] font-bold">Admin access required</h1>
          <p className="mt-2 text-[14px] text-[#4a4a59]">You&apos;re signed in as <b>{me.email}</b>, which isn&apos;t on the admin list. Ask an administrator to add your email to <code className="rounded bg-[#f2f2f2] px-1">ADMIN_EMAILS</code>.</p>
          <Link href="/web/dashboard/getstarted" className="mt-6 inline-block rounded-lg bg-[#141413] px-5 py-2.5 text-[14px] font-medium text-white">Back to your dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <MeContext.Provider value={{ me, setMe: (m: Me) => setMeRaw((p) => ({ ...p, ...m }) as Me) }}>
      <div className="font-app min-h-screen bg-[#f5f5f7] text-[#0f0f0f] lg:grid lg:grid-cols-[248px_1fr]">
        <Sidebar me={me} open={menu} onClose={() => setMenu(false)} />
        <div className="min-w-0">
          <header className="sticky top-0 z-30 flex h-[56px] items-center gap-3 border-b border-[#e1e1e1] bg-white px-4 lg:hidden">
            <button onClick={() => setMenu(true)} aria-label="Open menu"><Icon name="menu" className="h-6 w-6" /></button>
            <span className="font-semibold">Admin</span>
          </header>
          <div className="sticky top-0 z-20 hidden h-[56px] items-center justify-between gap-4 border-b border-[#e6e3dc] bg-white/85 px-8 backdrop-blur lg:flex">
            <GlobalSearch />
            <p className="hidden shrink-0 text-[13px] text-[#5c5a55] xl:block">{NAV.find((n) => (n.href === "/admin" ? path === "/admin" : path.startsWith(n.href)))?.label || "Admin"}</p>
            <div className="flex items-center gap-3 text-[13px]">
              <a href="/" target="_blank" rel="noreferrer" className="rounded-md border border-[#e1e1e1] px-3 py-1.5 transition hover:border-[#141413]">View website</a>
              <span className="grid h-8 w-8 place-items-center rounded-full bg-[#141413] text-[12px] font-semibold text-white">{me.name.trim()[0]?.toUpperCase() || "A"}</span>
            </div>
          </div>
          <main className="mx-auto w-full max-w-[1400px] p-4 md:p-8">{children}</main>
        </div>
        <Toaster />
      </div>
    </MeContext.Provider>
  );
}
