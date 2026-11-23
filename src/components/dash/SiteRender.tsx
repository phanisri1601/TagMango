/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
import type { Block, SiteTheme, Tone } from "./siteBlocks";

export type { Block, SiteTheme } from "./siteBlocks";

const PAPER = "#f4f2ed", MIST = "#e9e6e0", GRAPHITE = "#5c5a55", INK = "#141413", DARK = "#171716";

/** Readable text colour on any background (for the user's brand colour). */
function onColor(hex: string) {
  const h = /^#[0-9a-f]{6}$/i.test(hex) ? hex.slice(1) : "141413";
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? INK : "#ffffff";
}

const lines = (s?: string) => (s || "").split("\n").map((x) => x.trim()).filter(Boolean);
const embed = (url: string) => {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  return vm ? `https://player.vimeo.com/video/${vm[1]}` : null;
};

type Look = { t: Tone; bg: string; fg: string; muted: string; line: string; card: string };
function look(tone: Tone | undefined, color: string, dflt: Tone): Look {
  const t = tone || dflt;
  if (t === "dark") return { t, bg: DARK, fg: PAPER, muted: "#b9b5ad", line: "#3a3935", card: "#22211f" };
  if (t === "mist") return { t, bg: MIST, fg: INK, muted: GRAPHITE, line: "#d3cfc7", card: "#f4f2ed" };
  if (t === "brand") { const fg = onColor(color); return { t, bg: color, fg, muted: fg === "#ffffff" ? "#e5e2dc" : "#3b3a36", line: fg === "#ffffff" ? "#ffffff40" : "#14141330", card: fg === "#ffffff" ? "#ffffff18" : "#ffffff55" }; }
  return { t, bg: "#ffffff", fg: INK, muted: GRAPHITE, line: MIST, card: PAPER };
}

/**
 * Renders a website made in the Website Builder. Used by the live page and by the builder's preview.
 * Layout reacts to its own width (container queries), so the builder's phone and tablet previews are accurate.
 * `onSelect` is only passed by the builder: clicking a section in the preview selects it for editing.
 */
export default function SiteRender({ blocks, color, name, theme, onSelect, selected }: { blocks: Block[]; color: string; name?: string; theme?: SiteTheme; onSelect?: (id: string) => void; selected?: string | null }) {
  const serif = (theme?.font || "serif") === "serif";
  const r = theme?.radius === "sharp" ? 0 : 14;
  const head: CSSProperties = serif ? { fontFamily: "var(--font-cert-serif), Georgia, serif", fontWeight: 500, letterSpacing: "-0.01em" } : { fontFamily: "var(--font-poppins), system-ui, sans-serif", fontWeight: 600, letterSpacing: "-0.02em" };
  const body: CSSProperties = serif ? { fontFamily: "var(--font-cert-sans), system-ui, sans-serif", fontWeight: 300 } : { fontFamily: "var(--font-poppins), system-ui, sans-serif", fontWeight: 400 };
  const first = blocks.find((b) => b.button && b.link);

  const btn = (l: Look, label?: string, link?: string) => {
    if (!label) return null;
    // buttons: Paper on dark and brand-coloured bands, otherwise the brand colour
    const onBand = l.t === "dark" || l.t === "brand";
    const bg = onBand ? (l.t === "brand" ? l.fg : PAPER) : color;
    const fg = onBand ? (l.t === "brand" ? l.bg : INK) : onColor(color);
    return <a href={link || "#"} onClick={onSelect ? (e) => e.preventDefault() : undefined} className="inline-flex items-center justify-center px-7 py-3.5 text-[15px] font-medium transition hover:opacity-90" style={{ borderRadius: r === 0 ? 0 : 999, background: bg, color: fg, ...body }}>{label}</a>;
  };

  const section = (b: Block, dflt: Tone, inner: (l: Look, c: { center: boolean }) => React.ReactNode) => {
    const l = look(b.tone, color, dflt);
    const center = (b.align || (b.kind === "hero" || b.kind === "cta" || b.kind === "stats" ? "center" : "left")) === "center";
    return (
      <section key={b.id} id={`s-${b.id}`} onClick={onSelect ? () => onSelect(b.id) : undefined} className={`relative ${onSelect ? "cursor-pointer" : ""}`} style={{ background: l.bg, color: l.fg, ...body, outline: selected === b.id ? "2px solid #2563eb" : undefined, outlineOffset: -2 }}>
        <div className="mx-auto max-w-[1040px] px-6 @2xl:px-10">{inner(l, { center })}</div>
        {onSelect && selected === b.id && <span className="absolute left-2 top-2 z-10 rounded bg-[#2563eb] px-2 py-0.5 text-[11px] font-medium capitalize text-white">{b.kind}</span>}
      </section>
    );
  };
  const H = ({ children, size = 40, center, l }: { children: React.ReactNode; size?: number; center?: boolean; l: Look }) => <h2 className={`${center ? "text-center" : ""}`} style={{ ...head, fontSize: `clamp(${Math.round(size * 0.65)}px, 5.2cqw, ${size}px)`, lineHeight: 1.1, color: l.fg }}>{children}</h2>;
  const Eyebrow = ({ children, l, center }: { children: React.ReactNode; l: Look; center?: boolean }) => <p className={`mb-3 text-[12px] uppercase tracking-[0.24em] ${center ? "text-center" : ""}`} style={{ color: l.muted }}>{children}</p>;

  return (
    <div className="@container bg-white" style={{ containerType: "inline-size", ...body, color: INK }}>
      {name && (
        <header className="sticky top-0 z-20 border-b backdrop-blur" style={{ background: "#ffffffee", borderColor: MIST }}>
          <div className="mx-auto flex h-14 max-w-[1040px] items-center justify-between px-6 @2xl:px-10">
            <span style={{ ...head, fontSize: 20 }}>{name}</span>
            {first && <a href={first.link} className="px-4 py-2 text-[13px] font-medium" style={{ background: color, color: onColor(color), borderRadius: r === 0 ? 0 : 999 }}>{first.button}</a>}
          </div>
        </header>
      )}
      {blocks.length === 0 && <p className="p-16 text-center text-[14px]" style={{ color: GRAPHITE }}>This page is empty. Add a section to begin.</p>}
      {blocks.map((b) => {
        const items = lines(b.items);
        if (b.kind === "hero") return section(b, "dark", (l, { center }) => {
          const split = !center && !!b.image;
          return (
            <div className={`grid items-center gap-10 py-16 @2xl:py-24 ${split ? "@2xl:grid-cols-[1.1fr_1fr]" : ""}`}>
              <div className={center ? "mx-auto max-w-[760px] text-center" : ""}>
                {b.meta && <Eyebrow l={l} center={center}>{b.meta}</Eyebrow>}
                <h1 style={{ ...head, fontSize: "clamp(32px, 7cqw, 68px)", lineHeight: 1.04 }}>{b.title}</h1>
                {b.body && <p className="mt-5 text-[18px] leading-relaxed" style={{ color: l.muted }}>{b.body}</p>}
                {b.button && <div className={`mt-8 ${center ? "flex justify-center" : ""}`}>{btn(l, b.button, b.link)}</div>}
              </div>
              {b.image && <div className="overflow-hidden" style={{ borderRadius: r * 1.4 }}><img src={b.image} alt="" className="aspect-[4/3] w-full object-cover" /></div>}
              {center && b.image && <div className="mx-auto mt-2 w-full max-w-[860px] overflow-hidden" style={{ borderRadius: r * 1.4 }}><img src={b.image} alt="" className="aspect-video w-full object-cover" /></div>}
            </div>
          );
        });
        if (b.kind === "stats") return section(b, "light", (l) => (
          <div className="grid gap-8 py-12 @xl:grid-cols-3 @3xl:grid-cols-4">
            {items.map((it) => { const [v, lab] = it.split("|"); return <div key={it} className="text-center"><p style={{ ...head, fontSize: "clamp(32px, 5cqw, 52px)", lineHeight: 1 }}>{v}</p><p className="mt-2 text-[14px] uppercase tracking-[0.16em]" style={{ color: l.muted }}>{lab}</p></div>; })}
          </div>
        ));
        if (b.kind === "features") return section(b, "light", (l, { center }) => (
          <div className="py-16 @2xl:py-20">
            {b.title && <H l={l} center={center}>{b.title}</H>}
            {b.body && <p className={`mt-3 max-w-[640px] text-[17px] ${center ? "mx-auto text-center" : ""}`} style={{ color: l.muted }}>{b.body}</p>}
            <div className="mt-10 grid gap-4 @xl:grid-cols-2 @3xl:grid-cols-3">
              {items.map((it, i) => { const [t, d] = it.split("|"); return (
                <div key={it} className="p-6" style={{ background: l.card, border: `1px solid ${l.line}`, borderRadius: r }}>
                  <span className="grid h-9 w-9 place-items-center text-[14px] font-medium" style={{ background: color, color: onColor(color), borderRadius: r === 0 ? 0 : 999 }}>{i + 1}</span>
                  <p className="mt-4 text-[19px]" style={{ ...head }}>{t}</p>
                  {d && <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: l.muted }}>{d}</p>}
                </div>
              ); })}
            </div>
          </div>
        ));
        if (b.kind === "steps") return section(b, "mist", (l, { center }) => (
          <div className="py-16 @2xl:py-20">
            {b.title && <H l={l} center={center}>{b.title}</H>}
            <ol className="mt-10 grid gap-8 @2xl:grid-cols-3">
              {items.map((it, i) => { const [t, d] = it.split("|"); return (
                <li key={it} className="relative border-t pt-6" style={{ borderColor: l.fg }}>
                  <span style={{ ...head, fontSize: 48, lineHeight: 1, color: l.muted }}>{String(i + 1).padStart(2, "0")}</span>
                  <p className="mt-3 text-[21px]" style={head}>{t}</p>
                  {d && <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: l.muted }}>{d}</p>}
                </li>
              ); })}
            </ol>
          </div>
        ));
        if (b.kind === "text") return section(b, "light", (l, { center }) => (
          <div className={`py-16 @2xl:py-20 ${center ? "mx-auto max-w-[720px] text-center" : "max-w-[760px]"}`}>
            {b.title && <H l={l}>{b.title}</H>}
            <p className="mt-5 whitespace-pre-wrap text-[18px] leading-[1.75]" style={{ color: l.muted }}>{b.body}</p>
          </div>
        ));
        if (b.kind === "image") return section(b, "light", () => (
          <div className="py-10 @2xl:py-14">
            {b.image ? <figure><div className="overflow-hidden" style={{ borderRadius: r * 1.4 }}><img src={b.image} alt={b.body || ""} className="w-full object-cover" /></div>{b.body && <figcaption className="mt-3 text-center text-[14px]" style={{ color: GRAPHITE }}>{b.body}</figcaption>}</figure> : <div className="grid aspect-video place-items-center text-[14px]" style={{ background: MIST, color: GRAPHITE, borderRadius: r * 1.4 }}>Add an image in the settings</div>}
          </div>
        ));
        if (b.kind === "video") return section(b, "light", (l) => {
          const e = b.link ? embed(b.link) : null;
          return (
            <div className="mx-auto max-w-[860px] py-14 @2xl:py-16">
              {b.title && <H l={l} center size={34}>{b.title}</H>}
              <div className="mt-6 overflow-hidden bg-black" style={{ borderRadius: r * 1.4 }}>
                {e ? <iframe src={e} title={b.title || "Video"} className="aspect-video w-full" allow="encrypted-media; picture-in-picture" allowFullScreen /> : b.link ? <video src={b.link} controls className="aspect-video w-full" /> : <div className="grid aspect-video place-items-center text-[14px] text-white/70">Add a video link or upload a video</div>}
              </div>
            </div>
          );
        });
        if (b.kind === "testimonial") return section(b, "mist", (l, { center }) => {
          const qs = items.length ? items : b.body ? [`${b.body}|${b.title || ""}`] : [];
          return (
            <div className="py-16 @2xl:py-20">
              {items.length > 0 && b.title && <H l={l} center={center}>{b.title}</H>}
              <div className={`mt-10 grid gap-5 ${qs.length > 1 ? "@2xl:grid-cols-2" : "mx-auto max-w-[760px]"}`}>
                {qs.map((it) => { const [q, n, role] = it.split("|"); return (
                  <figure key={it} className="p-7" style={{ background: l.card, border: `1px solid ${l.line}`, borderRadius: r }}>
                    <span style={{ ...head, fontSize: 56, lineHeight: 0.6, color: l.muted }}>“</span>
                    <blockquote className="mt-2 text-[20px] leading-snug" style={head}>{q}</blockquote>
                    <figcaption className="mt-5 text-[14px]"><b className="font-medium">{n}</b>{role && <span style={{ color: l.muted }}> · {role}</span>}</figcaption>
                  </figure>
                ); })}
              </div>
            </div>
          );
        });
        if (b.kind === "offer") return section(b, "dark", (l) => (
          <div className="py-16 @2xl:py-20">
            <div className="mx-auto grid max-w-[900px] gap-8 p-8 @2xl:grid-cols-[1.2fr_1fr] @2xl:p-12" style={{ border: `1px solid ${l.line}`, borderRadius: r * 1.4, background: l.card }}>
              <div>
                {b.title && <H l={l} size={38}>{b.title}</H>}
                {b.body && <p className="mt-3 text-[16px] leading-relaxed" style={{ color: l.muted }}>{b.body}</p>}
                <ul className="mt-6 space-y-2.5">{items.map((it) => <li key={it} className="flex gap-3 text-[16px]"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: l.fg }} />{it}</li>)}</ul>
              </div>
              <div className="flex flex-col justify-center @2xl:border-l @2xl:pl-8" style={{ borderColor: l.line }}>
                {b.meta && <p style={{ ...head, fontSize: 54, lineHeight: 1 }}>{b.meta}</p>}
                <p className="mt-2 text-[13px]" style={{ color: l.muted }}>One-time payment. Secure checkout.</p>
                <div className="mt-6">{btn(l, b.button, b.link)}</div>
              </div>
            </div>
          </div>
        ));
        if (b.kind === "faq") return section(b, "light", (l, { center }) => (
          <div className="mx-auto max-w-[780px] py-16 @2xl:py-20">
            {b.title && <H l={l} center={center}>{b.title}</H>}
            <div className="mt-8 divide-y" style={{ borderTop: `1px solid ${l.line}`, borderBottom: `1px solid ${l.line}` }}>
              {items.map((it) => { const [q, a] = it.split("|"); return (
                <details key={it} className="group py-5" style={{ borderColor: l.line }}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[18px]" style={head}>{q}<span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[18px] leading-none transition-transform group-open:rotate-45" style={{ borderColor: l.line }}>+</span></summary>
                  <p className="mt-3 pr-10 text-[16px] leading-relaxed" style={{ color: l.muted }}>{a}</p>
                </details>
              ); })}
            </div>
          </div>
        ));
        // cta
        return section(b, "brand", (l) => (
          <div className="mx-auto max-w-[680px] py-16 text-center @2xl:py-20">
            {b.title && <H l={l} center size={44}>{b.title}</H>}
            {b.body && <p className="mt-4 text-[17px]" style={{ color: l.muted }}>{b.body}</p>}
            {b.button && <div className="mt-8 flex justify-center">{btn(l, b.button, b.link)}</div>}
          </div>
        ));
      })}
      {name && <footer className="border-t px-6 py-8 text-center text-[13px]" style={{ borderColor: MIST, color: GRAPHITE }}>© {new Date().getFullYear()} {name}</footer>}
    </div>
  );
}
