"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

/** Certificate designs. Colours are the Brand Book palette only: Paper, Mist, Graphite, Ink, Dark. */
export const CERT_DESIGNS = [
  { id: "professional", name: "Professional", note: "Clean and premium, like Coursera" },
  { id: "sidebar", name: "Achievement", note: "Dark side panel, like Internshala" },
  { id: "classic", name: "Classic", note: "Laurel and ornamental border" },
  { id: "modern", name: "Modern", note: "Bold left-aligned type" },
  { id: "dark", name: "Dark", note: "Dark with light type" },
  { id: "minimal", name: "Minimal", note: "Quiet and simple" },
] as const;
export type CertDesign = (typeof CERT_DESIGNS)[number]["id"];

/** Templates saved before the redesign keep working. */
const LEGACY: Record<string, CertDesign> = { navy: "professional", violet: "sidebar", mint: "minimal", rose: "modern" };
export const normalizeDesign = (id: unknown): CertDesign => (CERT_DESIGNS.some((d) => d.id === id) ? (id as CertDesign) : LEGACY[String(id)] || "professional");

export type CertData = {
  design?: string;
  title?: string;
  name: string;
  course?: string;
  issuer: string;
  signer?: string;
  signerTitle?: string;
  details?: string;
  date?: string;
  code?: string;
  verifyHost?: string;
};

const PAPER = "#f4f2ed", MIST = "#e9e6e0", GRAPHITE = "#5c5a55", INK = "#141413", DARK = "#171716";
const serif = { fontFamily: "var(--font-cert-serif), 'Cormorant Garamond', Georgia, serif" } as const;
const sans = { fontFamily: "var(--font-cert-sans), Jost, system-ui, sans-serif", fontWeight: 300 } as const;
const script = { fontFamily: "var(--font-cert-script), Allura, cursive" } as const;
const W = 1123, H = 794; // A4 landscape at 96 dpi

const fmt = (d?: string) => new Date(d || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
/** Long names shrink so they always fit on one line. */
const nameSize = (n: string, base: number) => Math.max(34, Math.min(base, Math.floor((base * 22) / Math.max(22, n.length))));
const verifyUrl = (d: CertData) => (d.code && d.verifyHost ? `${/^(localhost|127\.)/.test(d.verifyHost) ? "http" : "https"}://${d.verifyHost}/certificate/${d.code}` : "");

/* ------------------------------------------------------------------ ornaments */

/** Fine rosette of crossing ellipses, like the security patterns on banknotes and degrees. */
function Guilloche({ size, color = INK, opacity = 0.08, rings = 36 }: { size: number; color?: string; opacity?: number; rings?: number }) {
  return (
    <svg width={size} height={size} viewBox="-100 -100 200 200" style={{ opacity }} aria-hidden fill="none" stroke={color} strokeWidth="0.35">
      {Array.from({ length: rings }, (_, i) => <ellipse key={`a${i}`} rx="96" ry="40" transform={`rotate(${(i * 180) / rings})`} />)}
      {Array.from({ length: rings }, (_, i) => <ellipse key={`b${i}`} rx="74" ry="26" transform={`rotate(${(i * 180) / rings + 2.5})`} />)}
      {[98, 84, 60, 36, 18].map((r) => <circle key={r} r={r} />)}
    </svg>
  );
}

/** Scalloped seal with a star, ring text and ribbon tails. */
function Seal({ size = 120, fill = INK, ink = PAPER, label = "CERTIFIED", ribbon = true }: { size?: number; fill?: string; ink?: string; label?: string; ribbon?: boolean }) {
  const pts = Array.from({ length: 56 }, (_, i) => { const a = (i / 56) * Math.PI * 2, r = i % 2 ? 46.5 : 50; return `${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`; }).join(" ");
  const id = `ring${size}${fill.replace("#", "")}`;
  return (
    <svg width={size} height={ribbon ? size * 1.3 : size} viewBox={`0 0 100 ${ribbon ? 130 : 100}`} aria-hidden style={{ overflow: "visible" }}>
      <defs><path id={id} d="M50,50 m-33,0 a33,33 0 1,1 66,0 a33,33 0 1,1 -66,0" /></defs>
      {ribbon && <><polygon points="30,78 50,78 44,126 36,114 22,120" fill={fill} opacity="0.88" /><polygon points="70,78 50,78 56,126 64,114 78,120" fill={fill} opacity="0.7" /></>}
      <polygon points={pts} fill={fill} />
      <circle cx="50" cy="50" r="41" fill="none" stroke={ink} strokeWidth="0.8" opacity="0.8" />
      <circle cx="50" cy="50" r="44" fill="none" stroke={ink} strokeWidth="0.3" opacity="0.6" />
      <circle cx="50" cy="50" r="25" fill="none" stroke={ink} strokeWidth="0.6" opacity="0.7" />
      <text fontSize="6.2" letterSpacing="2.4" fill={ink} style={sans}><textPath href={`#${id}`} startOffset="1%">{`${label} • ${label} • ${label} •`}</textPath></text>
      <path d="M50 33 L54 45 L66.5 45 L56.5 52.5 L60.3 64.5 L50 57.2 L39.7 64.5 L43.5 52.5 L33.5 45 L46 45 Z" fill={ink} />
    </svg>
  );
}

/** Two laurel branches that frame the seal. */
function Laurel({ size = 170, color = GRAPHITE }: { size?: number; color?: string }) {
  const leaves = (flip: number) => Array.from({ length: 11 }, (_, i) => {
    const a = (-75 + i * 15) * (Math.PI / 180), r = 70;
    const x = 100 + flip * r * Math.cos(a) * 0.9 - flip * 8, y = 100 + r * Math.sin(a);
    return <ellipse key={i} cx={x} cy={y} rx="4.6" ry="11" transform={`rotate(${flip * (a * 57.3 + 20)} ${x} ${y})`} fill={color} opacity={0.35 + i * 0.05} />;
  });
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden>
      <g transform="translate(0,0)">{leaves(-1)}</g>
      <g>{leaves(1)}</g>
    </svg>
  );
}

/** Verification QR code (sharp squares, no library canvas). */
function QR({ url, size = 92, color = INK, bg = "#fff" }: { url: string; size?: number; color?: string; bg?: string }) {
  const q = useMemo(() => { try { return url ? QRCode.create(url, { errorCorrectionLevel: "M" }).modules : null; } catch { return null; } }, [url]);
  if (!q) return null;
  const n = q.size;
  const rects: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (q.get(x, y)) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.02" height="1.02" />);
  return (
    <div style={{ background: bg, padding: 7, display: "inline-block", lineHeight: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${n} ${n}`} fill={color} shapeRendering="crispEdges" aria-label="QR code to verify this certificate">{rects}</svg>
    </div>
  );
}

function Verify({ d, color = GRAPHITE, qrBg = "#fff", qrColor = INK, size = 86, stack = false }: { d: CertData; color?: string; qrBg?: string; qrColor?: string; size?: number; stack?: boolean }) {
  const url = verifyUrl(d);
  return (
    <div style={{ display: "flex", flexDirection: stack ? "column" : "row", alignItems: "center", gap: stack ? 6 : 12, color, textAlign: stack ? "center" : "left", ...sans }}>
      {url ? <QR url={url} size={size} bg={qrBg} color={qrColor} /> : null}
      <div style={{ fontSize: 12, lineHeight: 1.5, letterSpacing: "0.04em" }}>
        <div style={{ fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.16em", fontSize: 11 }}>Scan to verify</div>
        <div>{d.code || ""}</div>
      </div>
    </div>
  );
}

function Sign({ d, color = INK, line = GRAPHITE }: { d: CertData; color?: string; line?: string }) {
  return (
    <div style={{ width: 280, textAlign: "center", color }}>
      <div style={{ ...script, fontSize: 52, lineHeight: 1, height: 58 }}>{d.signer}</div>
      <div style={{ borderTop: `1px solid ${line}`, marginTop: 4, paddingTop: 8, fontSize: 15, ...sans }}>
        <div style={{ fontWeight: 400 }}>{d.signer}</div>
        {d.signerTitle ? <div style={{ opacity: 0.7, fontSize: 13 }}>{d.signerTitle}</div> : null}
      </div>
    </div>
  );
}

function DateBlock({ d, color = INK, line = GRAPHITE, label = "Date of issue" }: { d: CertData; color?: string; line?: string; label?: string }) {
  return (
    <div style={{ width: 280, textAlign: "center", color }}>
      <div style={{ ...sans, fontSize: 21, fontWeight: 400, height: 58, display: "grid", alignItems: "end", justifyContent: "center" }}>{fmt(d.date)}</div>
      <div style={{ borderTop: `1px solid ${line}`, marginTop: 4, paddingTop: 8, fontSize: 13, opacity: 0.75, ...sans }}>{label}</div>
    </div>
  );
}

const Notch = ({ s = 12, color = INK, style }: { s?: number; color?: string; style: React.CSSProperties }) => <div style={{ position: "absolute", width: s, height: s, background: color, ...style }} />;

/* ------------------------------------------------------------------ designs */

function Professional({ d }: { d: CertData }) {
  return (
    <div style={{ width: W, height: H, background: "#fff", color: INK, position: "relative", overflow: "hidden", ...sans }}>
      <div style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)" }}><Guilloche size={640} opacity={0.07} /></div>
      <div style={{ position: "absolute", inset: 24, border: `1px solid ${MIST}` }} />
      <div style={{ position: "absolute", inset: 34, border: `2px solid ${INK}` }} />
      <div style={{ position: "absolute", inset: 44, border: `1px solid ${GRAPHITE}`, opacity: 0.45 }} />
      {[{ top: 28, left: 28 }, { top: 28, right: 28 }, { bottom: 28, left: 28 }, { bottom: 28, right: 28 }].map((p, i) => <Notch key={i} style={p} s={14} />)}
      <div style={{ position: "absolute", inset: "70px 90px 60px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ width: 70, height: 1, background: GRAPHITE }} />
          <span style={{ fontSize: 17, letterSpacing: "0.46em", textTransform: "uppercase", fontWeight: 400 }}>{d.issuer}</span>
          <span style={{ width: 70, height: 1, background: GRAPHITE }} />
        </div>
        <div style={{ ...serif, fontSize: 25, letterSpacing: "0.34em", textTransform: "uppercase", color: GRAPHITE, marginTop: 30 }}>{d.title || "Certificate of Completion"}</div>
        <div style={{ marginTop: 28, fontSize: 19, fontStyle: "italic", ...serif, color: GRAPHITE }}>This is to certify that</div>
        <div style={{ ...serif, fontSize: nameSize(d.name, 82), lineHeight: 1.08, marginTop: 6, fontWeight: 500 }}>{d.name}</div>
        <div style={{ width: 460, height: 1, background: `linear-gradient(90deg, transparent, ${GRAPHITE}, transparent)`, margin: "14px 0" }} />
        <div style={{ fontSize: 17, color: GRAPHITE }}>has successfully completed</div>
        <div style={{ ...serif, fontSize: 38, fontWeight: 600, marginTop: 6, lineHeight: 1.15, maxWidth: 820 }}>{d.course || "the programme"}</div>
        {d.details ? <div style={{ marginTop: 8, fontSize: 15, color: GRAPHITE }}>{d.details}</div> : null}
        <div style={{ marginTop: 14, fontSize: 14, letterSpacing: "0.2em", textTransform: "uppercase", color: GRAPHITE }}>Issued on {fmt(d.date)}</div>
        <div style={{ marginTop: "auto", width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ width: 280 }}><Verify d={d} /></div>
          <div style={{ marginBottom: -6 }}><Seal size={108} /></div>
          <Sign d={d} />
        </div>
      </div>
    </div>
  );
}

function Sidebar({ d }: { d: CertData }) {
  return (
    <div style={{ width: W, height: H, background: PAPER, color: INK, position: "relative", display: "flex", overflow: "hidden", ...sans }}>
      <div style={{ width: 300, background: DARK, color: PAPER, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", padding: "62px 28px 44px", textAlign: "center" }}>
        <div style={{ position: "absolute", left: "50%", top: "46%", transform: "translate(-50%,-50%)" }}><Guilloche size={520} color={MIST} opacity={0.1} /></div>
        <div style={{ position: "relative", fontSize: 15, letterSpacing: "0.4em", textTransform: "uppercase", fontWeight: 400 }}>{d.issuer}</div>
        <div style={{ position: "relative", width: 40, height: 1, background: GRAPHITE, margin: "18px 0" }} />
        <div style={{ position: "relative", ...serif, fontSize: 25, lineHeight: 1.3, opacity: 0.95 }}>{d.title || "Certificate of Completion"}</div>
        <div style={{ position: "relative", marginTop: "auto", marginBottom: 6 }}><Seal size={142} fill={PAPER} ink={DARK} /></div>
        <div style={{ position: "relative", marginTop: 26 }}><Verify d={d} color={MIST} qrBg={PAPER} /></div>
      </div>
      <div style={{ position: "absolute", left: 300, top: 0, bottom: 0, width: 6, background: INK }} />
      <div style={{ flex: 1, padding: "64px 66px 50px 80px", display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ position: "absolute", right: -60, top: 120, opacity: 1 }}><Guilloche size={420} opacity={0.05} /></div>
        <div style={{ position: "relative", fontSize: 15, letterSpacing: "0.34em", textTransform: "uppercase", color: GRAPHITE }}>Certificate of achievement</div>
        <div style={{ position: "relative", marginTop: 38, fontSize: 20, ...serif, fontStyle: "italic", color: GRAPHITE }}>This certificate is proudly presented to</div>
        <div style={{ position: "relative", ...serif, fontSize: nameSize(d.name, 72), lineHeight: 1.08, marginTop: 8, fontWeight: 500 }}>{d.name}</div>
        <div style={{ position: "relative", height: 3, width: 80, background: INK, margin: "22px 0" }} />
        <div style={{ position: "relative", fontSize: 17, color: GRAPHITE }}>for successfully completing</div>
        <div style={{ position: "relative", ...serif, fontSize: 37, fontWeight: 600, lineHeight: 1.15, marginTop: 6 }}>{d.course || "the programme"}</div>
        {d.details ? <div style={{ position: "relative", marginTop: 10, fontSize: 15, color: GRAPHITE }}>{d.details}</div> : null}
        <div style={{ position: "relative", marginTop: "auto", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div><div style={{ fontSize: 12, letterSpacing: "0.22em", textTransform: "uppercase", color: GRAPHITE }}>Issued on</div><div style={{ fontSize: 21, marginTop: 6, fontWeight: 400 }}>{fmt(d.date)}</div></div>
          <Sign d={d} />
        </div>
      </div>
    </div>
  );
}

function Classic({ d }: { d: CertData }) {
  return (
    <div style={{ width: W, height: H, background: PAPER, color: INK, position: "relative", overflow: "hidden", ...sans }}>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }} aria-hidden>
        <defs><pattern id="wave" width="28" height="14" patternUnits="userSpaceOnUse"><path d="M0 7 Q7 -2 14 7 T28 7" fill="none" stroke={INK} strokeWidth="0.8" /><path d="M0 11 Q7 2 14 11 T28 11" fill="none" stroke={GRAPHITE} strokeWidth="0.5" /></pattern></defs>
        <rect x="18" y="18" width={W - 36} height={H - 36} fill="none" stroke={INK} strokeWidth="2" />
        <rect x="34" y="34" width={W - 68} height="14" fill="url(#wave)" /><rect x="34" y={H - 48} width={W - 68} height="14" fill="url(#wave)" />
        <rect x="34" y="34" width="14" height={H - 68} fill="url(#wave)" /><rect x={W - 48} y="34" width="14" height={H - 68} fill="url(#wave)" />
        <rect x="52" y="52" width={W - 104} height={H - 104} fill="none" stroke={GRAPHITE} strokeWidth="1" />
      </svg>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}><Guilloche size={560} opacity={0.055} /></div>
      <div style={{ position: "absolute", left: 76, top: 72 }}><Verify d={d} size={58} stack /></div>
      <div style={{ position: "absolute", inset: "74px 118px 70px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: 16, letterSpacing: "0.44em", textTransform: "uppercase", color: GRAPHITE, fontWeight: 400 }}>{d.issuer}</div>
        <div style={{ ...serif, fontSize: 58, marginTop: 14, letterSpacing: "0.03em", fontWeight: 500 }}>{d.title || "Certificate of Completion"}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "10px 0 16px", color: GRAPHITE }}><span style={{ width: 120, height: 1, background: GRAPHITE }} />✦<span style={{ width: 120, height: 1, background: GRAPHITE }} /></div>
        <div style={{ ...serif, fontStyle: "italic", fontSize: 20, color: GRAPHITE }}>This certificate is proudly awarded to</div>
        <div style={{ ...script, fontSize: nameSize(d.name, 96), lineHeight: 1.1, marginTop: 4 }}>{d.name}</div>
        <div style={{ fontSize: 17, color: GRAPHITE, marginTop: 4 }}>in recognition of successfully completing</div>
        <div style={{ ...serif, fontSize: 34, fontWeight: 600, marginTop: 4, lineHeight: 1.15 }}>{d.course || "the programme"}</div>
        {d.details ? <div style={{ marginTop: 6, fontSize: 15, color: GRAPHITE }}>{d.details}</div> : null}
        <div style={{ marginTop: "auto", width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <DateBlock d={d} label="Date" />
          <div style={{ position: "relative", width: 170, height: 190, display: "grid", placeItems: "center", marginBottom: -14 }}>
            <div style={{ position: "absolute", top: 8 }}><Laurel size={170} /></div>
            <div style={{ position: "relative", top: -4 }}><Seal size={92} /></div>
          </div>
          <Sign d={d} />
        </div>
      </div>
    </div>
  );
}

function Modern({ d }: { d: CertData }) {
  return (
    <div style={{ width: W, height: H, background: "#fff", color: INK, position: "relative", overflow: "hidden", ...sans }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 26, background: INK }} />
      <div style={{ position: "absolute", left: 26, top: 0, bottom: 0, width: 6, background: MIST }} />
      <div style={{ position: "absolute", right: -120, top: -80 }}><Guilloche size={620} opacity={0.06} /></div>
      <div style={{ position: "absolute", inset: "60px 80px 50px 104px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 18, letterSpacing: "0.36em", textTransform: "uppercase", fontWeight: 400 }}>{d.issuer}</div>
          <Seal size={84} />
        </div>
        <div style={{ marginTop: 30, fontSize: 15, letterSpacing: "0.34em", textTransform: "uppercase", color: GRAPHITE }}>{d.title || "Certificate of Completion"}</div>
        <div style={{ ...serif, fontSize: nameSize(d.name, 92), lineHeight: 1.05, marginTop: 18, fontWeight: 500 }}>{d.name}</div>
        <div style={{ height: 4, width: 90, background: INK, margin: "24px 0" }} />
        <div style={{ fontSize: 19, color: GRAPHITE }}>has successfully completed</div>
        <div style={{ ...serif, fontSize: 44, fontWeight: 600, lineHeight: 1.12, marginTop: 8, maxWidth: 800 }}>{d.course || "the programme"}</div>
        {d.details ? <div style={{ marginTop: 10, fontSize: 16, color: GRAPHITE }}>{d.details}</div> : null}
        <div style={{ marginTop: "auto", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "end", gap: 30, borderTop: `1px solid ${MIST}`, paddingTop: 22 }}>
          <div><div style={{ fontSize: 12, letterSpacing: "0.2em", textTransform: "uppercase", color: GRAPHITE }}>Issued on</div><div style={{ fontSize: 21, marginTop: 6, fontWeight: 400 }}>{fmt(d.date)}</div><div style={{ marginTop: 10 }}><Verify d={d} size={64} /></div></div>
          <div />
          <Sign d={d} />
        </div>
      </div>
    </div>
  );
}

function Dark({ d }: { d: CertData }) {
  return (
    <div style={{ width: W, height: H, background: DARK, color: PAPER, position: "relative", overflow: "hidden", ...sans }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}><Guilloche size={640} color={MIST} opacity={0.07} /></div>
      <div style={{ position: "absolute", inset: 26, border: `1px solid ${GRAPHITE}` }} />
      <div style={{ position: "absolute", inset: 38, border: `2px solid ${MIST}`, opacity: 0.55 }} />
      {[{ top: 32, left: 32 }, { top: 32, right: 32 }, { bottom: 32, left: 32 }, { bottom: 32, right: 32 }].map((p, i) => <Notch key={i} style={p} s={12} color={MIST} />)}
      <div style={{ position: "absolute", inset: "76px 100px 62px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div style={{ fontSize: 16, letterSpacing: "0.46em", textTransform: "uppercase", color: MIST, fontWeight: 400 }}>{d.issuer}</div>
        <div style={{ ...serif, fontSize: 30, letterSpacing: "0.28em", textTransform: "uppercase", marginTop: 24 }}>{d.title || "Certificate of Completion"}</div>
        <div style={{ ...serif, fontStyle: "italic", fontSize: 20, color: MIST, opacity: 0.8, marginTop: 30 }}>Awarded to</div>
        <div style={{ ...serif, fontSize: nameSize(d.name, 84), lineHeight: 1.08, marginTop: 6, fontWeight: 500 }}>{d.name}</div>
        <div style={{ width: 90, height: 1, background: GRAPHITE, margin: "20px 0 16px" }} />
        <div style={{ fontSize: 17, color: MIST, opacity: 0.85 }}>for successfully completing</div>
        <div style={{ ...serif, fontSize: 38, fontWeight: 600, marginTop: 6, lineHeight: 1.15 }}>{d.course || "the programme"}</div>
        {d.details ? <div style={{ marginTop: 8, fontSize: 15, color: MIST, opacity: 0.8 }}>{d.details}</div> : null}
        <div style={{ marginTop: 14, fontSize: 14, letterSpacing: "0.2em", textTransform: "uppercase", color: MIST, opacity: 0.8 }}>Issued on {fmt(d.date)}</div>
        <div style={{ marginTop: "auto", width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ width: 280 }}><Verify d={d} color={MIST} qrBg={PAPER} /></div>
          <div style={{ marginBottom: -6 }}><Seal size={104} fill={PAPER} ink={DARK} /></div>
          <Sign d={d} color={PAPER} line={GRAPHITE} />
        </div>
      </div>
    </div>
  );
}

function Minimal({ d }: { d: CertData }) {
  return (
    <div style={{ width: W, height: H, background: MIST, color: INK, position: "relative", ...sans }}>
      <div style={{ position: "absolute", inset: 44, background: PAPER, border: `1px solid ${GRAPHITE}`, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "52px 80px 38px", overflow: "hidden" }}>
        <div style={{ position: "absolute", left: "50%", top: "52%", transform: "translate(-50%,-50%)" }}><Guilloche size={520} opacity={0.05} /></div>
        <div style={{ position: "relative", fontSize: 15, letterSpacing: "0.46em", textTransform: "uppercase", color: GRAPHITE, fontWeight: 400 }}>{d.issuer}</div>
        <div style={{ position: "relative", ...serif, fontSize: 46, marginTop: 34, fontWeight: 500 }}>{d.title || "Certificate of Completion"}</div>
        <div style={{ position: "relative", fontSize: 17, color: GRAPHITE, marginTop: 32 }}>This certifies that</div>
        <div style={{ position: "relative", ...serif, fontSize: nameSize(d.name, 70), marginTop: 8, lineHeight: 1.1, borderBottom: `1px solid ${GRAPHITE}`, padding: "0 40px 10px" }}>{d.name}</div>
        <div style={{ position: "relative", fontSize: 17, color: GRAPHITE, marginTop: 20 }}>has completed</div>
        <div style={{ position: "relative", ...serif, fontSize: 34, fontWeight: 600, marginTop: 6, lineHeight: 1.15 }}>{d.course || "the programme"}</div>
        {d.details ? <div style={{ position: "relative", marginTop: 8, fontSize: 15, color: GRAPHITE }}>{d.details}</div> : null}
        <div style={{ position: "relative", marginTop: "auto", width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <DateBlock d={d} label="Date" />
          <Verify d={d} size={70} />
          <Sign d={d} />
        </div>
      </div>
    </div>
  );
}

const BODY: Record<CertDesign, (p: { d: CertData }) => React.ReactElement> = { professional: Professional, sidebar: Sidebar, classic: Classic, modern: Modern, dark: Dark, minimal: Minimal };

/**
 * A4-landscape certificate that scales to whatever width it is given, and prints at full size.
 * `data.name` is always the learner's own name from their record.
 */
export default function Certificate({ data, className = "" }: { data: CertData; className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    window.addEventListener("beforeprint", fit);
    return () => { ro.disconnect(); window.removeEventListener("beforeprint", fit); };
  }, []);
  const Body = BODY[normalizeDesign(data.design)];
  return (
    <div ref={box} className={`cert-fit relative w-full overflow-hidden ${className}`} style={{ aspectRatio: `${W} / ${H}` }}>
      <div style={{ width: W, height: H, transform: `scale(${scale})`, transformOrigin: "top left", position: "absolute", left: 0, top: 0 }}>
        <Body d={data} />
      </div>
    </div>
  );
}
