"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "./ui";

/** Site tree: About, Programme, Resources, Apply and enrol, Learner login. */
export const NAV_GROUPS: { label: string; href?: string; items?: [string, string, string][] }[] = [
  { label: "About", items: [["About", "/about", "Who is behind the programme"], ["Stories and proof", "/stories", "Real outcomes from learners"]] },
  { label: "Programme", items: [["THE HUMAN OS™", "/programme", "The six-week programme"], ["The method", "/method", "How the work is done"], ["Events and workshops", "/events", "Free masterclass and live events"]] },
  { label: "Resources", items: [["Blog", "/blog", "Articles and ideas"], ["Free resource", "/free-resource", "A short guide, sent to your inbox"]] },
  { label: "Apply and enrol", items: [["Apply", "/apply", "Tell us where you are"], ["Enrol and pay", "/enrol", "Secure your seat"]] },
  { label: "Learner login", href: "/portal" },
];

const Chevron = () => (
  <svg viewBox="0 0 20 20" className="h-3 w-3 transition-transform duration-300 group-hover:rotate-180 group-has-[:focus-visible]:rotate-180" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 8 5 5 5-5" /></svg>
);

export default function Navbar({ light = false }: { light?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => setOpen(false), [path]);

  const dark = light && !scrolled; // dark text on a light page
  const text = dark ? "text-ink/75 hover:bg-black/5 hover:text-ink" : "text-white/80 hover:bg-white/10 hover:text-white";
  const active = (g: (typeof NAV_GROUPS)[number]) => (g.href ? path === g.href : g.items!.some(([, h]) => h === path));

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4">
      <nav
        className={`flex w-full max-w-[940px] items-center justify-between rounded-full border pl-5 pr-2 backdrop-blur-xl transition-all duration-300 ease-out ${scrolled ? "py-1" : "py-1.5"} ${
          dark ? "border-black/10 bg-white/90 shadow-[0_6px_24px_-12px_rgba(0,0,0,0.25)]" : scrolled ? "border-white/10 bg-[#141413]/[0.97] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-2xl" : "border-white/10 bg-white/[0.06]"
        }`}
      >
        <Logo dark={dark} className="!text-[22px] shrink-0" />
        <div className="hidden items-center gap-1 md:flex">
          {NAV_GROUPS.map((g) =>
            g.href ? (
              <Link key={g.label} href={g.href} className={`rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-200 ${text} ${active(g) ? (dark ? "bg-black/5 !text-ink" : "bg-white/10 !text-white") : ""}`}>{g.label}</Link>
            ) : (
              <div key={g.label} className="group relative">
                <button type="button" aria-haspopup="true" className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors duration-200 ${text} ${active(g) ? (dark ? "bg-black/5 !text-ink" : "bg-white/10 !text-white") : ""}`}>
                  {g.label}<Chevron />
                </button>
                {/* pt-3 is an invisible bridge so the menu does not close while the pointer crosses the gap */}
                <div className="invisible absolute left-1/2 top-full z-10 w-[270px] -translate-x-1/2 translate-y-1 pt-3 opacity-0 transition-all duration-200 ease-out group-has-[:focus-visible]:visible group-has-[:focus-visible]:translate-y-0 group-has-[:focus-visible]:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <ul className={`rounded-2xl border p-1.5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)] backdrop-blur-xl ${dark ? "border-black/10 bg-white" : "border-white/10 bg-[#171716]/95"}`}>
                    {g.items!.map(([t, h, d]) => (
                      <li key={h}>
                        <Link href={h} className={`block rounded-xl px-3.5 py-2.5 transition-colors ${dark ? "hover:bg-black/5" : "hover:bg-white/10"} ${path === h ? (dark ? "bg-black/5" : "bg-white/10") : ""}`}>
                          <span className={`block text-[14px] font-medium ${dark ? "text-ink" : "text-white"}`}>{t}</span>
                          <span className={`block text-[12px] ${dark ? "text-ink/50" : "text-white/50"}`}>{d}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          )}
          <Link href="/web/sign-up" className={`ml-1.5 rounded-full px-5 py-2 text-[13.5px] font-semibold transition duration-200 hover:opacity-90 ${dark ? "bg-ink text-white" : "bg-white text-ink"}`}>Sign-Up</Link>
        </div>
        <button aria-label="Menu" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={`grid h-10 w-10 place-items-center rounded-full transition-colors md:hidden ${dark ? "text-ink hover:bg-black/5" : "text-white hover:bg-white/10"}`}>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>
      <div className={`absolute inset-x-3 top-[68px] max-h-[75vh] origin-top overflow-auto rounded-3xl border border-white/10 bg-[#171716]/95 p-3 backdrop-blur-xl transition-all duration-300 ease-out md:hidden ${open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-2 opacity-0"}`}>
        {NAV_GROUPS.map((g) => (
          <div key={g.label} className="px-1 py-1">
            {g.href ? <Link href={g.href} className="block rounded-2xl px-3 py-2.5 text-white/90 hover:bg-white/5">{g.label}</Link> : (
              <>
                <p className="px-3 pt-2 text-[11px] uppercase tracking-wider text-white/40">{g.label}</p>
                {g.items!.map(([t, h]) => <Link key={h} href={h} className="block rounded-2xl px-3 py-2.5 text-white/90 hover:bg-white/5">{t}</Link>)}
              </>
            )}
          </div>
        ))}
        <Link href="/web/sign-up" className="mt-2 block rounded-2xl bg-white px-4 py-3 text-center font-semibold text-ink">Sign-Up</Link>
      </div>
    </header>
  );
}
