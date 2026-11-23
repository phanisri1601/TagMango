"use client";
/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import { inputCls } from "@/components/dash/kit";
import { Icon } from "@/components/dash/icons";
import { isCloudLink, uploadFile } from "@/lib/upload";

export type MediaKind = "image" | "video" | "audio" | "file";
const ACCEPT: Record<MediaKind, string> = { image: "image/*", video: "video/*", audio: "audio/*", file: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.txt,.csv" };
const WORD: Record<MediaKind, string> = { image: "image", video: "video", audio: "audio file", file: "file" };

/**
 * One field, two ways in: upload a file from your computer, or paste a web address.
 * Uploaded files are saved to Cloud and the field stores their link (/api/cloud/<id>).
 */
export default function MediaField({ value, onChange, kind = "image", placeholder, preview = true }: { value: string; onChange: (v: string) => void; kind?: MediaKind; placeholder?: string; preview?: boolean }) {
  const pick = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [err, setErr] = useState("");
  const uploaded = isCloudLink(value);

  async function go(f?: File | null) {
    if (!f) return;
    setErr(""); setPct(0); setName(f.name);
    try {
      const u = await uploadFile(f, setPct);
      onChange(u.url);
      window.dispatchEvent(new CustomEvent("tm:changed", { detail: "cloud" }));
    } catch (e) {
      setErr((e as Error).message);
    }
    setPct(null);
    if (pick.current) pick.current.value = "";
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className={inputCls} placeholder={placeholder || (kind === "image" ? "https://…/image.jpg" : kind === "video" ? "https://… (YouTube, Vimeo or a video link)" : "https://…")} value={uploaded ? "" : value} disabled={pct !== null} onChange={(e) => onChange(e.target.value)} />
        <input ref={pick} type="file" hidden accept={ACCEPT[kind]} onChange={(e) => go(e.target.files?.[0])} />
        <button type="button" disabled={pct !== null} onClick={() => pick.current?.click()} className="flex shrink-0 items-center gap-1.5 rounded-md border border-[#141413] px-3.5 text-[13px] font-medium transition hover:bg-[#141413] hover:text-white disabled:opacity-50">
          <Icon name="upload" className="h-4 w-4" />{pct !== null ? `${pct}%` : "Upload"}
        </button>
      </div>
      {pct !== null && (
        <div>
          <div className="h-1.5 overflow-hidden rounded-full bg-[#e9e6e0]"><div className="h-full rounded-full bg-[#141413] transition-all" style={{ width: `${pct}%` }} /></div>
          <p className="mt-1 truncate text-[12px] text-[#5c5a55]">Uploading {name}…</p>
        </div>
      )}
      {uploaded && pct === null && (
        <div className="flex items-center gap-3 rounded-md border border-[#e9e6e0] bg-[#f4f2ed] p-2">
          {preview && kind === "image" ? <img src={value} alt="" className="h-12 w-20 rounded object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded bg-[#e9e6e0]"><Icon name={kind === "video" ? "play" : "link"} className="h-5 w-5" /></span>}
          <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">Uploaded {WORD[kind]}{name ? `: ${name}` : ""}</p><p className="text-[12px] text-[#5c5a55]">Saved in Cloud</p></div>
          <button type="button" onClick={() => { onChange(""); setName(""); }} className="rounded-md px-2 py-1 text-[12px] text-[#5c5a55] underline hover:text-[#141413]">Remove</button>
        </div>
      )}
      {!uploaded && value && kind === "image" && preview && /^https?:\/\//.test(value) && <img src={value} alt="" className="h-20 w-36 rounded-md border border-[#e9e6e0] object-cover" />}
      {err && <p className="text-[12px] text-[#cf1322]">{err}</p>}
    </div>
  );
}
