"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { H1, Label, Section } from "@/components/site/ui";

function Form() {
  const q = useSearchParams();
  const [state, setState] = useState<"ask" | "done" | "err">("ask");
  const email = q.get("e") || "";
  return (
    <Section className="max-w-[640px]">
      <Label>Footer and utility</Label>
      <H1 className="mt-4">{state === "done" ? "You are unsubscribed" : "Unsubscribe"}</H1>
      {state === "done" ? <p className="mt-6 text-[17px] font-light">We will not send any more automated emails to {email}.</p> : (
        <>
          <p className="mt-6 text-[17px] font-light">Stop automated emails to <b>{email}</b>?</p>
          {state === "err" && <p className="mt-3 text-[#b3261e]">This link is not valid.</p>}
          <button className="mt-6 bg-[#141413] px-6 py-3 text-[14px] text-[#f4f2ed]" onClick={async () => {
            const r = await fetch("/api/unsub", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ c: q.get("c"), e: email, t: q.get("t") }) }).then((x) => x.json()).catch(() => ({ error: 1 }));
            setState(r.error ? "err" : "done");
          }}>Yes, unsubscribe me</button>
        </>
      )}
    </Section>
  );
}
export default function Unsubscribe() { return <Suspense><Form /></Suspense>; }
