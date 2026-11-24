"use client";
import { useState } from "react";
import { patchMe, toast, useMe } from "@/lib/client";
import { Panel, Title } from "./kit";

/** Switch between creator and learner. This only changes where you land after signing in. */
export default function AccountTypeCard() {
  const { me, setMe } = useMe();
  const [busy, setBusy] = useState(false);
  const cur = me.accountType === "learner" ? "learner" : "creator";

  async function pick(t: "creator" | "learner") {
    if (t === cur) return;
    setBusy(true);
    try {
      const r = await patchMe({ accountType: t });
      setMe(r.user);
      toast(t === "learner" ? "You will now land on your courses page after sign-in" : "You will now land on the creator dashboard after sign-in");
    } catch (e) {
      toast((e as Error).message, "err");
    }
    setBusy(false);
  }

  return (
    <Panel className="mt-5 p-5" delay={0.03}>
      <Title sub="Decides which page opens first after you sign in. You can still open the other one any time.">Account type</Title>
      <div className="mt-4 inline-grid grid-cols-2 gap-1 rounded-lg bg-[#f0eee9] p-1 text-[14px]">
        {(["creator", "learner"] as const).map((t) => (
          <button key={t} disabled={busy} onClick={() => pick(t)} className={`rounded-md px-5 py-2 font-medium capitalize transition ${cur === t ? "bg-white shadow-sm" : "text-[#5c5a55]"}`}>{t}</button>
        ))}
      </div>
    </Panel>
  );
}
