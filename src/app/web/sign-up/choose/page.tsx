"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AuthLayout from "@/components/auth/AuthLayout";
import { ErrorText } from "@/components/auth/fields";

const OPTIONS = [
  { id: "creator", title: "I'm a creator", text: "I want to sell courses, run masterclasses and grow my audience.", next: "/signup/about" },
  { id: "learner", title: "I'm a learner", text: "I joined a programme and want to learn, attend classes and earn my certificate.", next: "/learn" },
] as const;

/** Shown once after sign-up (and once for older accounts), so each person lands in the right place from then on. */
export default function Choose() {
  const router = useRouter();
  const [busy, setBusy] = useState<string>();
  const [error, setError] = useState<string>();

  async function pick(o: (typeof OPTIONS)[number]) {
    setBusy(o.id);
    setError(undefined);
    const r = await fetch("/api/me", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ accountType: o.id }) });
    if (r.status === 401) return router.push("/login");
    if (!r.ok) {
      setBusy(undefined);
      return setError((await r.json().catch(() => ({}))).error || "Something went wrong. Please try again.");
    }
    router.push(o.next);
    router.refresh();
  }

  return (
    <AuthLayout>
      <div className="max-w-[420px]">
        <h1 className="text-[30px] font-semibold leading-tight">How will you use Nitienaa Rao?</h1>
        <p className="mt-2 text-[14px] text-ink/80">Choose one. You can change it later in Account settings.</p>
        <div className="mt-8 space-y-3">
          {OPTIONS.map((o) => (
            <button key={o.id} type="button" disabled={Boolean(busy)} onClick={() => pick(o)} className="block w-full rounded-xl border border-[#d9d9d9] bg-white p-5 text-left transition hover:border-[#141413] hover:shadow-md focus-visible:outline-2 focus-visible:outline-[#141413] disabled:opacity-60">
              <span className="block text-[17px] font-semibold">{busy === o.id ? "One moment…" : o.title}</span>
              <span className="mt-1 block text-[13.5px] text-ink/70">{o.text}</span>
            </button>
          ))}
        </div>
        <div className="mt-4"><ErrorText>{error}</ErrorText></div>
      </div>
    </AuthLayout>
  );
}
