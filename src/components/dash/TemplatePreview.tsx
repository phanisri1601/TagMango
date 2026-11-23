import { MODE, type Template } from "./templates";

/** A small drawing of a template: what the page looks like, not just its colours. */
export default function TemplatePreview({ t, title = "How to Be Great", sub = "A complete guide to better habits" }: { t: Template; title?: string; sub?: string }) {
  const m = MODE[t.mode];
  const serif = t.font === "serif" ? { fontFamily: "var(--font-cert-serif), Georgia, serif" } : { fontFamily: "var(--font-poppins), sans-serif" };
  const image = <div className="rounded-[3px]" style={{ background: `repeating-linear-gradient(135deg, ${m.line} 0 3px, transparent 3px 6px), ${m.card}`, border: `1px solid ${m.line}` }} />;
  return (
    <div className="aspect-[4/3] overflow-hidden rounded-md border" style={{ background: m.bg, color: m.text, borderColor: m.line }}>
      <div className="flex items-center justify-between px-2.5 py-1.5" style={{ borderBottom: `1px solid ${m.line}` }}><span className="text-[7px] font-semibold" style={serif}>Creator</span><span className="rounded-full px-1.5 py-[1px] text-[5px]" style={{ background: m.accent, color: m.onAccent }}>Enrol</span></div>
      {t.layout === "split" && (
        <div className="grid h-[62%] grid-cols-[1.1fr_1fr] gap-2 p-2.5"><div className="flex flex-col justify-center"><p className="text-[5px] uppercase tracking-widest" style={{ color: m.muted }}>Programme</p><p className="mt-0.5 text-[13px] font-semibold leading-[1.05]" style={serif}>{title}</p><p className="mt-1 text-[5.5px]" style={{ color: m.muted }}>{sub}</p><span className="mt-1.5 w-fit rounded-full px-2 py-[2px] text-[5.5px]" style={{ background: m.accent, color: m.onAccent }}>Join now</span></div>{image}</div>
      )}
      {t.layout === "center" && (
        <div className="flex h-[62%] flex-col items-center justify-center px-3 text-center"><p className="text-[5px] uppercase tracking-widest" style={{ color: m.muted }}>Programme</p><p className="mt-0.5 text-[14px] font-semibold leading-[1.05]" style={serif}>{title}</p><p className="mt-1 text-[5.5px]" style={{ color: m.muted }}>{sub}</p><span className="mt-1.5 rounded-full px-2 py-[2px] text-[5.5px]" style={{ background: m.accent, color: m.onAccent }}>Join now</span></div>
      )}
      {t.layout === "editorial" && (
        <div className="grid h-[62%] grid-cols-[1.5fr_1fr] gap-2 p-2.5" style={{ borderBottom: `1px solid ${m.line}` }}><div className="flex flex-col justify-end"><p className="text-[16px] font-medium leading-[1]" style={serif}>{title}</p><div className="my-1.5 h-px w-8" style={{ background: m.text }} /><p className="text-[5.5px]" style={{ color: m.muted }}>{sub}</p></div>{image}</div>
      )}
      <div className="grid grid-cols-3 gap-1.5 px-2.5 pt-2">{[1, 2, 3].map((n) => <div key={n} className="rounded-[2px] p-1" style={{ background: m.card, border: `1px solid ${m.line}` }}><div className="text-[5px] font-semibold" style={{ color: m.muted }}>0{n}</div><div className="mt-0.5 h-[2px] w-5" style={{ background: m.text, opacity: 0.55 }} /><div className="mt-0.5 h-[2px] w-7" style={{ background: m.muted, opacity: 0.5 }} /></div>)}</div>
    </div>
  );
}
