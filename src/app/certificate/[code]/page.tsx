"use client";
import { use, useEffect, useState } from "react";
import Certificate, { type CertData } from "@/components/Certificate";

type C = CertData & { date: string; code: string };

/** Public certificate page: the learner's certificate, a way to download or share it, and proof it is genuine. */
export default function CertificatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [c, setC] = useState<C | null | undefined>(undefined);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    fetch(`/api/public/certificate?code=${encodeURIComponent(code)}`).then((r) => (r.ok ? r.json() : null)).then(setC).catch(() => setC(null));
  }, [code]);
  if (c === undefined) return <div className="grid min-h-screen place-items-center bg-[#f4f2ed] text-[#5c5a55]">Loading…</div>;
  if (!c) return <div className="grid min-h-screen place-items-center bg-[#f4f2ed] p-6 text-center"><div><p className="text-[22px] font-semibold">Certificate not found</p><p className="mt-2 text-[#5c5a55]">Check the credential ID and try again.</p></div></div>;
  const url = typeof window === "undefined" ? "" : window.location.href;
  const d = new Date(c.date);
  const linkedin = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(`${c.title || "Certificate"}: ${c.course || ""}`.slice(0, 100))}&organizationName=${encodeURIComponent(c.issuer)}&issueYear=${d.getFullYear()}&issueMonth=${d.getMonth() + 1}&certUrl=${encodeURIComponent(url)}&certId=${encodeURIComponent(c.code)}`;
  return (
    <div className="min-h-screen bg-[#f4f2ed] px-4 py-8 text-[#141413] print:bg-white print:p-0" style={{ fontFamily: "var(--font-cert-sans), system-ui, sans-serif" }}>
      <style>{`@media print { @page { size: A4 landscape; margin: 0 } body { background: #fff } }`}</style>
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div><p className="text-[13px] uppercase tracking-[0.2em] text-[#5c5a55]">Certificate verified</p><p className="text-[22px] font-medium" style={{ fontFamily: "var(--font-cert-serif), Georgia, serif" }}>Issued to {c.name} by {c.issuer}</p></div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-md bg-[#141413] px-4 py-2.5 text-[14px] text-white" onClick={() => window.print()}>Download / Print PDF</button>
            <a className="rounded-md border border-[#141413] px-4 py-2.5 text-[14px]" href={linkedin} target="_blank" rel="noreferrer">Add to LinkedIn</a>
            <button className="rounded-md border border-[#141413] px-4 py-2.5 text-[14px]" onClick={() => { navigator.clipboard?.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); }}>{copied ? "Link copied" : "Copy link"}</button>
          </div>
        </div>
        <div className="overflow-hidden border border-[#e9e6e0] bg-white shadow-[0_30px_70px_-40px_rgba(0,0,0,0.5)] print:border-0 print:shadow-none"><Certificate data={{ ...c, verifyHost: typeof window === "undefined" ? "" : window.location.host }} /></div>
        <p className="mt-4 text-[13px] text-[#5c5a55] print:hidden">Credential ID <b>{c.code}</b> · issued on {d.toLocaleDateString("en-IN", { dateStyle: "long" })}. Anyone with this link can confirm the certificate is genuine.</p>
      </div>
    </div>
  );
}
