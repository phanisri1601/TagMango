"use client";
import { useState } from "react";
import { toast, useMe } from "@/lib/client";
import { Btn, Field, Panel, Title, inputCls } from "./kit";

/** Set or change the password used for email or phone sign-in. One-time codes keep working either way. */
export default function PasswordCard() {
  const { me } = useMe();
  const [has, setHas] = useState<boolean | null>(null);
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const changing = has === null ? Boolean((me as unknown as { hasPassword?: boolean }).hasPassword) : has;

  async function save() {
    setBusy(true);
    setErr("");
    const r = await fetch("/api/auth/password", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ current, password, confirm }) }).then((x) => x.json());
    setBusy(false);
    if (r.error) return setErr(r.error);
    setHas(true);
    setCurrent("");
    setPassword("");
    setConfirm("");
    toast("Password saved");
  }

  return (
    <Panel className="mt-5 p-5" delay={0.04}>
      <Title sub="Sign in with your email or phone and a password. One-time codes still work.">{changing ? "Change password" : "Set a password"}</Title>
      <div className="mt-4 grid max-w-xl gap-3 sm:grid-cols-2">
        {changing && <div className="sm:col-span-2"><Field label="Current password"><input className={inputCls} type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} /></Field></div>}
        <Field label="New password" hint="8+ characters, with a letter and a number"><input className={inputCls} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        <Field label="Confirm new password"><input className={inputCls} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
      </div>
      {err && <p className="mt-3 text-[13px] text-[#cf1322]">{err}</p>}
      <div className="mt-4"><Btn disabled={busy || !password || !confirm || (changing && !current)} onClick={save}>{busy ? "Saving…" : "Save password"}</Btn></div>
    </Panel>
  );
}
