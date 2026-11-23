"use client";
import { useState } from "react";
import { input } from "./ui";

type Kind = "resource" | "apply" | "contact";

/** One form component for the three website forms. Opt-in for WhatsApp is on every form that asks for a number. */
export default function SiteForm({ kind, consent, cta, done }: { kind: Kind; consent: string; cta: string; done: React.ReactNode }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", message: "", pattern: "", why: "", ready: "", opt: false, consent: false });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<{ url?: string | null } | null>(null);
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));

  if (ok) return <div className="border border-[#141413] bg-[#ffffff] p-6"><div className="text-[16px] leading-relaxed">{done}</div>{ok.url ? <a href={ok.url} target="_blank" rel="noreferrer" className="mt-4 inline-block bg-[#141413] px-6 py-3 text-[14px] text-[#f4f2ed]">Open your free resource</a> : null}</div>;

  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true); setMsg("");
        const src = new URLSearchParams(location.search).get("src") || "";
        const r = await fetch("/api/public/site", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind, name: f.name, email: f.email, phone: f.phone, whatsappOptIn: f.opt, consent: f.consent, message: f.message, src, answers: { pattern: f.pattern, why: f.why, ready: f.ready } }),
        }).then((x) => x.json()).catch(() => ({ error: "Network error. Try again." }));
        setBusy(false);
        if (r.error) return setMsg(r.error);
        setOk({ url: r.url });
      }}
    >
      <input className={input} placeholder="Full name" value={f.name} onChange={(e) => set("name", e.target.value)} required />
      <input className={input} type="email" placeholder="Email" value={f.email} onChange={(e) => set("email", e.target.value)} required />
      {kind !== "contact" && <input className={input} inputMode="numeric" maxLength={10} placeholder={kind === "apply" ? "WhatsApp number (10 digits)" : "WhatsApp number (optional)"} value={f.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} required={kind === "apply"} />}
      {kind === "apply" && (
        <>
          <textarea className={input} rows={3} placeholder="Which situation do you keep reacting to in the same way?" value={f.pattern} onChange={(e) => set("pattern", e.target.value)} />
          <textarea className={input} rows={4} placeholder="Why are you applying now?" value={f.why} onChange={(e) => set("why", e.target.value)} required />
          <select className={input} value={f.ready} onChange={(e) => set("ready", e.target.value)}>
            <option value="">Can you give about 4 hours a week for 6 weeks?</option>
            <option>Yes</option><option>Probably, I want to talk it through</option><option>Not right now</option>
          </select>
        </>
      )}
      {kind === "contact" && <textarea className={input} rows={5} placeholder="Your message" value={f.message} onChange={(e) => set("message", e.target.value)} required />}
      {kind !== "contact" && f.phone.length === 10 && (
        <label className="flex gap-2 text-[13px] text-[#555]"><input type="checkbox" className="mt-0.5 accent-[#141413]" checked={f.opt} onChange={(e) => set("opt", e.target.checked)} />Yes, you may message me on WhatsApp about this. I can stop any time.</label>
      )}
      {kind !== "contact" && (
        <label className="flex gap-2 text-[13px] text-[#555]"><input type="checkbox" className="mt-0.5 accent-[#141413]" checked={f.consent} onChange={(e) => set("consent", e.target.checked)} /><span>{consent} I have read the <a className="underline" href="/privacy" target="_blank">privacy policy</a>.</span></label>
      )}
      {msg && <p className="text-[14px] text-[#b3261e]">{msg}</p>}
      <button disabled={busy} className="bg-[#141413] px-7 py-3 text-[14px] tracking-[0.04em] text-[#f4f2ed] disabled:opacity-60">{busy ? "Sending…" : cta}</button>
    </form>
  );
}
