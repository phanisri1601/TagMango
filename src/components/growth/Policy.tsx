import Link from "next/link";
import { wrap } from "@/components/site/ui";

export function Policy({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className={`${wrap} py-14`}>
      <article className="max-w-2xl space-y-4 text-[16px] leading-relaxed [&_h2]:mt-8 [&_h2]:text-[26px] [&_h2]:leading-tight [&_h2]:font-medium [&_h2]:[font-family:var(--font-vietnam)] [&_ul]:list-disc [&_ul]:pl-6">
        <h1 className="text-[48px] leading-none" style={{ fontFamily: "var(--font-vietnam), system-ui, sans-serif" }}>{title}</h1>
        <p className="border border-[#d6d2c9] bg-[#f4f2ed] p-3 text-[13px] text-[#6f6c66]">Template text for you to review with a lawyer and edit before launch. Replace the bracketed items.</p>
        {children}
        <p className="pt-6 text-[13px] text-[#777]"><Link href="/privacy" className="underline">Privacy</Link> · <Link href="/terms" className="underline">Terms</Link> · <Link href="/refund-policy" className="underline">Refund policy</Link></p>
      </article>
    </div>
  );
}
