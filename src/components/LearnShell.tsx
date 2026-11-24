"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BRAND } from "@/lib/brand";

/** Plain page frame for learners: brand, My courses, Programme, and sign out. */
export default function LearnShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const link = (href: string, label: string, on: boolean) => <Link href={href} className={`rounded-md px-3 py-1.5 text-[14px] transition ${on ? "bg-[#141413] text-white" : "text-[#3f3e3a] hover:bg-[#ede9e1]"}`}>{label}</Link>;
  return (
    <div className="min-h-screen bg-[#f7f5f0] text-[#141413]">
      <header className="sticky top-0 z-30 border-b border-[#e6e3dc] bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[60px] max-w-6xl items-center gap-3 px-4">
          <Link href="/learn" className="font-display text-[21px] font-bold tracking-tight">{BRAND}</Link>
          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            {link("/learn", "My courses", path.startsWith("/learn"))}
            {link("/portal", "Programme", false)}
          </nav>
          <div className="ml-auto flex items-center gap-2 text-[13px]">
            <Link href="/web/dashboard/getstarted" className="hidden rounded-md border border-[#e1e1e1] px-3 py-1.5 hover:border-[#141413] sm:block">Creator dashboard</Link>
            <button className="rounded-md border border-[#e1e1e1] px-3 py-1.5 hover:border-[#141413]" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }}>Sign out</button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
