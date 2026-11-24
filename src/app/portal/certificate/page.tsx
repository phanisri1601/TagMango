"use client";
import { useEffect, useState } from "react";

/** The learner's certificate lives on its public page, so it can be shared and verified. */
export default function Certificate() {
  const [p, setP] = useState<{ completed: boolean; certificateCode?: string; certificatePending?: boolean } | null>(null);
  useEffect(() => { fetch("/api/portal").then((r) => r.json()).then(setP); }, []);
  useEffect(() => { if (p?.completed && p.certificateCode) window.location.replace(`/certificate/${p.certificateCode}`); }, [p]);
  if (!p) return null;
  if (p.certificatePending) return <p className="p-10 text-center">You have completed the programme. Your coach will approve your certificate soon, and you will get an email when it is ready.</p>;
  if (!p.completed) return <p className="p-10 text-center">Finish every lesson and assignment to unlock your certificate.</p>;
  return <p className="p-10 text-center">Opening your certificate…</p>;
}
