import Link from "next/link";
import { BRAND } from "@/lib/brand";

export function Logo({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  const words = BRAND.split(" ");
  const head = words.length > 1 ? words.slice(0, -1).join(" ") + " " : BRAND.slice(0, Math.ceil(BRAND.length / 2));
  const tail = words.length > 1 ? words[words.length - 1] : BRAND.slice(Math.ceil(BRAND.length / 2));
  return (
    <Link href="/" className={`inline-flex items-center whitespace-pre font-display font-bold tracking-tight ${dark ? "text-ink" : "text-white"} ${className}`} aria-label={`${BRAND} home`}>
      <span>{head}</span>
      <span className="text-mango">{tail}</span>
    </Link>
  );
}

export function Arrow({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden>
      <path d="M4 10h12m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PrimaryButton({ href = "/web/sign-up", children, className = "" }: { href?: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`bg-mango inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_30px_-8px_rgba(var(--accent-rgb),0.7)] transition hover:brightness-110 active:scale-[0.98] ${className}`}
    >
      {children}
    </Link>
  );
}

export function GhostButton({ href = "/demo", children, className = "" }: { href?: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-8 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/[0.12] ${className}`}
    >
      {children}
    </Link>
  );
}

export function DarkButton({ href = "/demo", children, className = "" }: { href?: string; children: React.ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-white transition hover:bg-black ${className}`}
    >
      {children}
    </Link>
  );
}

const avatarGradients = [
  "from-amber-300 to-orange-500",
  "from-rose-300 to-pink-500",
  "from-sky-300 to-indigo-500",
  "from-emerald-300 to-teal-500",
  "from-violet-300 to-purple-600",
  "from-yellow-200 to-amber-500",
  "from-orange-300 to-red-500",
  "from-cyan-300 to-blue-500",
];

export function Avatar({ name, i = 0, className = "h-8 w-8 text-xs" }: { name: string; i?: number; className?: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <div className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold text-white ${avatarGradients[i % avatarGradients.length]} ${className}`}>
      {initials}
    </div>
  );
}

export function PortraitPlaceholder({ name, i = 0, className = "" }: { name: string; i?: number; className?: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <div className={`relative overflow-hidden bg-gradient-to-b ${avatarGradients[i % avatarGradients.length]} ${className}`}>
      <div className="absolute inset-x-[18%] top-[16%] aspect-square rounded-full bg-white/25" />
      <div className="absolute inset-x-[6%] bottom-0 h-[38%] rounded-t-[50%] bg-white/20" />
      <span className="absolute inset-0 grid place-items-center pb-[18%] font-display text-2xl font-bold text-white/90">{initials}</span>
    </div>
  );
}
