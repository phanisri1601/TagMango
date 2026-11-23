/* eslint-disable @next/next/no-img-element */
"use client";
import { useState } from "react";

export type CaseData = {
  userId: string; name: string; email: string; phone?: string; status: string; submittedAt: string;
  pan: string; legalName: string; dob?: string; address?: string; docs: { pan?: string; id?: string; idType?: string; selfie?: string };
  reviewerEmail?: string; reviewerName?: string; assignedAt?: string; assignedBy?: string;
  reviewedBy?: string; reviewedAt?: string; reviewerRemarks?: string; recommendation?: "approve" | "corrections";
  finalBy?: string; finalAt?: string; note?: string; history: { at: string; by: string; role: string; action: string; note?: string }[];
};

export const STATUS_TEXT: Record<string, string> = {
  pending: "Submitted, waiting for a reviewer", assigned: "With the reviewer", reviewed: "Reviewer's recommendation is in, waiting for the final decision",
  verified: "Approved", rejected: "Rejected", resubmit: "Resubmission requested",
};
export const when = (iso?: string) => (iso ? new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—");

function Doc({ label, id }: { label: string; id?: string }) {
  const [big, setBig] = useState(false);
  if (!id) return null;
  const href = `/api/cloud/${id}`;
  return (
    <div className="rounded-lg border border-[#e1e1e1] p-2.5">
      <p className="text-[12px] font-medium uppercase tracking-wide text-[#5c5a55]">{label}</p>
      <div className="mt-2 overflow-hidden rounded bg-[#f4f2ed]">
        <img src={href} alt={label} className={`w-full object-contain ${big ? "max-h-[520px]" : "max-h-40"}`} onClick={() => setBig(!big)} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
      </div>
      <a href={href} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[13px] underline">Open the file in a new tab</a>
    </div>
  );
}

/** One KYC case, laid out for checking: the person's details, their documents, and everything that has happened so far. */
export default function CaseView({ c }: { c: CaseData }) {
  const row = (k: string, v?: string) => <div className="grid grid-cols-[130px_1fr] gap-3 py-1.5 text-[14px]"><span className="text-[#5c5a55]">{k}</span><span className="break-words font-medium">{v || "—"}</span></div>;
  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-[#f4f2ed] px-3 py-2 text-[13px]"><b>{STATUS_TEXT[c.status] || c.status}</b></div>
      <section>
        <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#5c5a55]">Personal details</p>
        <div className="divide-y divide-[#ededed]">
          {row("Name on PAN", c.legalName)}{row("PAN", c.pan)}{row("Date of birth", c.dob)}{row("Address", c.address)}{row("Account", `${c.name} · ${c.email}${c.phone ? " · " + c.phone : ""}`)}{row("Submitted", when(c.submittedAt))}
        </div>
      </section>
      <section>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#5c5a55]">Documents</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Doc label="PAN card" id={c.docs.pan} /><Doc label={c.docs.idType || "ID proof"} id={c.docs.id} /><Doc label="Selfie" id={c.docs.selfie} />
        </div>
      </section>
      {(c.reviewerName || c.reviewerEmail) && (
        <section>
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#5c5a55]">Review</p>
          <div className="divide-y divide-[#ededed]">
            {row("Reviewer", `${c.reviewerName || ""} ${c.reviewerEmail ? "(" + c.reviewerEmail + ")" : ""}`)}{row("Assigned", `${when(c.assignedAt)}${c.assignedBy ? " by " + c.assignedBy : ""}`)}
            {c.reviewedAt && <>{row("Recommendation", c.recommendation === "approve" ? "Approve for final review" : "Request corrections")}{row("Reviewed by", c.reviewedBy)}{row("Reviewed at", when(c.reviewedAt))}{row("Remarks", c.reviewerRemarks)}</>}
          </div>
        </section>
      )}
      {c.finalAt && <section><p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-[#5c5a55]">Final decision</p><div className="divide-y divide-[#ededed]">{row("Decided by", c.finalBy)}{row("Decided at", when(c.finalAt))}{c.note && row("Reason", c.note)}</div></section>}
      <section>
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-[#5c5a55]">History</p>
        <ol className="space-y-2 border-l border-[#d3cfc7] pl-4">
          {[...c.history].reverse().map((h, i) => (
            <li key={i} className="relative text-[13px]"><span className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#141413]" /><b>{h.action}</b> <span className="text-[#5c5a55]">· {h.role} · {h.by} · {when(h.at)}</span>{h.note && <p className="text-[#3f3e3a]">“{h.note}”</p>}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
