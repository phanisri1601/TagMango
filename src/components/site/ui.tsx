import Link from "next/link";

export const serif = { fontFamily: "var(--font-vietnam), system-ui, sans-serif" } as const;
export const wrap = "mx-auto w-full max-w-[1080px] px-5 sm:px-8";

/** Small spaced capitals, used for section labels. */
export const Label = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-[12px] font-normal uppercase tracking-[0.22em] text-[#6f6c66] ${className}`}>{children}</p>
);

export const H1 = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h1 className={`text-[40px] font-bold leading-[1.08] tracking-tight sm:text-[56px] ${className}`} style={serif}>{children}</h1>
);
export const H2 = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <h2 className={`text-[30px] font-bold leading-[1.15] tracking-tight sm:text-[38px] ${className}`} style={serif}>{children}</h2>
);

export const Rule = ({ className = "" }: { className?: string }) => <hr className={`border-0 border-t border-[#1c1c1c] ${className}`} />;

type BtnProps = { href: string; children: React.ReactNode; variant?: "solid" | "outline"; className?: string };
export function Button({ href, children, variant = "solid", className = "" }: BtnProps) {
  const cls = variant === "solid" ? "bg-mango text-white hover:brightness-110 rounded-full" : "border border-[#1c1c1c] text-[#1c1c1c] hover:bg-[#1c1c1c] hover:text-white rounded-full";
  return <Link href={href} className={`inline-block px-6 py-3 text-[14px] tracking-[0.04em] transition ${cls} ${className}`}>{children}</Link>;
}

export const Section = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <section className={`${wrap} py-14 sm:py-20 ${className}`}>{children}</section>
);

/** Boxed card: thin dark outline for primary items, grey outline for sub-items, as in the site map. */
export const Card = ({ children, className = "", strong = false }: { children: React.ReactNode; className?: string; strong?: boolean }) => (
  <div className={`bg-[#faf9f6] p-6 ${strong ? "border border-[#1c1c1c]" : "border border-[#d6d2c9]"} ${className}`}>{children}</div>
);

export const input = "w-full border border-[#bdb8ac] bg-[#faf9f6] px-3.5 py-3 text-[15px] outline-none focus:border-[#1c1c1c]";
