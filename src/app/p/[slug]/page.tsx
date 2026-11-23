/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CheckoutBox from "@/components/CheckoutBox";
import LeadForm from "@/components/LeadForm";
import TrackView from "@/components/TrackView";
import { MODE, tpl } from "@/components/dash/templates";
import { findPage } from "@/lib/public";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await findPage(slug);
  if (!data) return {};
  return { title: String(data.page.headline || data.page.title), description: data.page.subheadline ? String(data.page.subheadline) : undefined };
}

export default async function MangoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await findPage(slug);
  if (!data) notFound();
  const { page, mango, creator } = data;
  const t = tpl(page.template);
  const m = MODE[t.mode];
  const serif = t.font === "serif";
  const head = serif ? { fontFamily: "var(--font-cert-serif), Georgia, serif", fontWeight: 500, letterSpacing: "-0.01em" } : { fontFamily: "var(--font-poppins), sans-serif", fontWeight: 600, letterSpacing: "-0.02em" };
  const body = serif ? { fontFamily: "var(--font-cert-sans), system-ui, sans-serif", fontWeight: 300 } : { fontFamily: "var(--font-poppins), system-ui, sans-serif" };
  const bullets = String(page.bullets || "").split("\n").map((b) => b.trim()).filter(Boolean);
  const price = mango ? (mango.type === "Free" ? 0 : Number(mango.discountPrice || mango.price || 0)) : 0;
  const cover = mango?.cover ? String(mango.cover) : "";
  const center = t.layout === "center";
const dark = t.mode === "dark" || t.mode === "graphite";

  const visual = cover ? (
    <div className="overflow-hidden rounded-2xl" style={{ boxShadow: dark ? "none" : "0 30px 60px -35px rgba(0,0,0,0.45)" }}><img src={cover} alt="" className="aspect-[4/3] w-full object-cover" /></div>
  ) : (
    <div className="aspect-[4/3] w-full rounded-2xl" style={{ background: `repeating-linear-gradient(135deg, ${m.line} 0 6px, transparent 6px 12px), ${m.card}`, border: `1px solid ${m.line}` }} />
  );

  return (
    <div className="min-h-screen" style={{ background: m.bg, color: m.text, ...body }}>
      <TrackView kind="page" refId={page.id} />
      <header className="sticky top-0 z-20 border-b backdrop-blur" style={{ background: `${m.bg}ee`, borderColor: m.line }}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
          <span className="text-[20px]" style={head}>{creator?.name || ""}</span>
          <a href="#buy" className="rounded-full px-5 py-2 text-[13px] font-medium" style={{ background: m.accent, color: m.onAccent }}>{price ? "Enrol now" : "Get access"}</a>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-12 pt-14 md:pb-20 md:pt-24">
        {t.layout === "split" && (
          <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
            <div>
              {creator && <p className="animate-rise text-[12px] uppercase tracking-[0.26em]" style={{ color: m.muted }}>By {creator.name}</p>}
              <h1 className="animate-rise mt-4 text-[40px] leading-[1.05] md:text-[62px]" style={{ ...head, ["--delay" as string]: "0.08s" }}>{String(page.headline)}</h1>
              {page.subheadline ? <p className="animate-rise mt-5 max-w-xl text-[18px] leading-relaxed" style={{ color: m.muted, ["--delay" as string]: "0.16s" }}>{String(page.subheadline)}</p> : null}
              <a href="#buy" className="animate-rise mt-8 inline-block rounded-full px-8 py-3.5 text-[15px] font-medium" style={{ background: m.accent, color: m.onAccent, ["--delay" as string]: "0.24s" }}>{price ? "Enrol now" : "Get access"}</a>
            </div>
            <div className="animate-rise" style={{ ["--delay" as string]: "0.2s" }}>{visual}</div>
          </div>
        )}
        {center && (
          <div className="text-center">
            {creator && <p className="animate-rise text-[12px] uppercase tracking-[0.26em]" style={{ color: m.muted }}>By {creator.name}</p>}
            <h1 className="animate-rise mx-auto mt-4 max-w-4xl text-[40px] leading-[1.04] md:text-[68px]" style={{ ...head, ["--delay" as string]: "0.08s" }}>{String(page.headline)}</h1>
            {page.subheadline ? <p className="animate-rise mx-auto mt-5 max-w-2xl text-[18px] leading-relaxed" style={{ color: m.muted, ["--delay" as string]: "0.16s" }}>{String(page.subheadline)}</p> : null}
            <a href="#buy" className="animate-rise mt-8 inline-block rounded-full px-8 py-3.5 text-[15px] font-medium" style={{ background: m.accent, color: m.onAccent, ["--delay" as string]: "0.24s" }}>{price ? "Enrol now" : "Get access"}</a>
            {cover && <div className="animate-rise mx-auto mt-12 max-w-3xl" style={{ ["--delay" as string]: "0.3s" }}>{visual}</div>}
          </div>
        )}
        {t.layout === "editorial" && (
          <div className="grid gap-10 md:grid-cols-[1.5fr_1fr]">
            <div className="flex flex-col justify-end">
              {creator && <p className="animate-rise text-[12px] uppercase tracking-[0.26em]" style={{ color: m.muted }}>By {creator.name}</p>}
              <h1 className="animate-rise mt-4 text-[44px] leading-[1] md:text-[84px]" style={{ ...head, ["--delay" as string]: "0.08s" }}>{String(page.headline)}</h1>
              <div className="my-6 h-px w-24" style={{ background: m.text }} />
              {page.subheadline ? <p className="animate-rise max-w-xl text-[18px] leading-relaxed" style={{ color: m.muted, ["--delay" as string]: "0.16s" }}>{String(page.subheadline)}</p> : null}
            </div>
            <div className="animate-rise self-end" style={{ ["--delay" as string]: "0.2s" }}>{visual}</div>
          </div>
        )}
      </section>

      <section className="border-y py-5" style={{ borderColor: m.line }}>
        <div className="mx-auto grid max-w-6xl gap-3 px-5 text-center text-[13px] sm:grid-cols-3" style={{ color: m.muted }}>
          <span>Secure payment by Razorpay</span><span>Instant access after payment</span><span>Questions? Message {creator?.name?.split(" ")[0] || "the creator"} anytime</span>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr] md:py-20">
        <div className="space-y-12">
          <div>
            <p className="text-[12px] uppercase tracking-[0.26em]" style={{ color: m.muted }}>About this offering</p>
            <h2 className="mt-2 text-[30px] leading-tight md:text-[38px]" style={head}>{mango ? String(mango.title) : String(page.title)}</h2>
            {mango?.description ? <p className="mt-4 whitespace-pre-wrap text-[17px] leading-[1.75]" style={{ color: m.muted }}>{String(mango.description)}</p> : null}
          </div>
          {bullets.length > 0 && (
            <div>
              <p className="text-[12px] uppercase tracking-[0.26em]" style={{ color: m.muted }}>What you will get</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {bullets.map((b, i) => (
                  <div key={b} className="rounded-2xl p-5" style={{ background: m.card, border: `1px solid ${m.line}` }}>
                    <span className="text-[28px] leading-none" style={{ ...head, color: m.muted }}>{String(i + 1).padStart(2, "0")}</span>
                    <p className="mt-3 text-[16px] leading-snug">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {page.leadForm ? <div className="rounded-2xl p-6" style={{ background: m.card, border: `1px solid ${m.line}`, color: INK }}><LeadForm slug={String(page.slug)} /></div> : null}
        </div>
        <div id="buy" className="md:sticky md:top-20 md:self-start" style={{ color: INK }}>
          {mango ? (
            <CheckoutBox accent="#141413" mangoId={mango.id} title={String(mango.title)} price={price} type={String(mango.type)} cycle={mango.cycle as string | undefined} terms={mango.terms as string | undefined} successText={mango.successText as string | undefined} successButton={mango.successButton as string | undefined} redirectUrl={mango.redirectUrl as string | undefined} />
          ) : (
            <div className="rounded-2xl p-6 text-center" style={{ background: m.card, border: `1px solid ${m.line}`, color: m.muted }}>This offering isn&apos;t available right now.</div>
          )}
        </div>
      </section>

      <footer className="border-t px-5 py-8 text-center text-[13px]" style={{ borderColor: m.line, color: m.muted }}>© {new Date().getFullYear()} {creator?.name || ""}</footer>
    </div>
  );
}

const INK = "#141413";
