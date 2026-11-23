"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DevOtpNote, ErrorText, OrangeButton, OtpBoxes, PhoneInput, ResendTimer, inputCls, post } from "./fields";

type Method = "password" | "otp";
type Stage = "id" | "otp" | "forgot" | "reset";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const admin = params.get("as") === "admin";
  const [method, setMethod] = useState<Method>("password");
  const [via, setVia] = useState<"phone" | "email">(admin ? "email" : "phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [stage, setStage] = useState<Stage>("id");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [loading, setLoading] = useState(false);

  const ident = via === "phone" ? { phone } : { email };
  const ready = via === "phone" ? phone.length === 10 : /^\S+@\S+\.\S+$/.test(email);
  const flag = admin ? { admin: true } : {};

  function go(next: string) {
    const back = params.get("afterLoginRedirectTo");
    router.push(back && /^\/(web\/dashboard|admin|reviewer|portal)(\/|$)/.test(back) && !back.startsWith("//") && (!admin || back.startsWith("/admin")) ? back : next);
    router.refresh();
  }

  async function requestOtp(target: Stage = "otp", only?: { email: string }) {
    setError(undefined);
    setLoading(true);
    const r = await post<{ devOtp?: string }>("/api/auth/otp", { mode: "login", ...(only || ident), ...flag });
    setLoading(false);
    if (r.error) return setError(r.error);
    setDevOtp(r.devOtp);
    setOtp("");
    setStage(target);
  }

  async function verify(code = otp) {
    if (loading) return;
    if (code.replace(/\s/g, "").length !== 6) return setError("Enter the 6-digit OTP");
    setError(undefined);
    setLoading(true);
    const r = await post<{ next: string }>("/api/auth/verify", { mode: "login", ...ident, code, ...flag });
    setLoading(false);
    if (r.error) return setError(r.error);
    go(r.next);
  }

  async function passwordLogin() {
    setError(undefined);
    setLoading(true);
    const r = await post<{ next: string }>("/api/auth/login", { ...ident, password, ...flag });
    setLoading(false);
    if (r.error) return setError(r.error);
    go(r.next);
  }

  async function resetPassword() {
    if (otp.replace(/\s/g, "").length !== 6) return setError("Enter the 6-digit OTP");
    setError(undefined);
    setLoading(true);
    const r = await post("/api/auth/reset", { email, code: otp, password: newPw, confirm });
    setLoading(false);
    if (r.error) return setError(r.error);
    setPassword("");
    setNewPw("");
    setConfirm("");
    setMethod("password");
    setVia("email");
    setStage("id");
    setNotice("Password updated. Sign in with your new password.");
  }

  /* ---- forgot password: ask for the email, then code + new password ---- */
  if (stage === "forgot") {
    const okEmail = /^\S+@\S+\.\S+$/.test(email);
    return (
      <div className="animate-soft-fade max-w-[400px]">
        <h1 className="text-[30px] font-semibold leading-tight">Reset your password</h1>
        <p className="mt-2 text-[14px] text-ink/70">We will send a one-time code to your email.</p>
        <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); if (okEmail) requestOtp("reset", { email }); }}>
          <input autoFocus className={inputCls} type="email" placeholder="Your account email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <ErrorText>{error}</ErrorText>
          <OrangeButton disabled={!okEmail} loading={loading}>Send code</OrangeButton>
          <button type="button" className="block w-full text-center text-[13px] underline" onClick={() => { setStage("id"); setError(undefined); }}>Back to sign in</button>
        </form>
      </div>
    );
  }
  if (stage === "reset") {
    return (
      <div className="animate-soft-fade max-w-[400px]">
        <h1 className="text-[30px] font-semibold leading-tight">Set a new password</h1>
        <p className="mt-2 text-[14px] text-ink/70">Enter the code sent to <b>{email}</b> and choose a new password.</p>
        <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); resetPassword(); }}>
          <OtpBoxes value={otp} onChange={setOtp} />
          <DevOtpNote code={devOtp} />
          <input className={inputCls} type={show ? "text" : "password"} autoComplete="new-password" placeholder="New password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          <input className={inputCls} type={show ? "text" : "password"} autoComplete="new-password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <label className="flex items-center gap-2 text-[12px] text-ink/70"><input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-[#141413]" />Show passwords</label>
          <ErrorText>{error}</ErrorText>
          <OrangeButton loading={loading}>Save new password</OrangeButton>
          <ResendTimer onResend={() => requestOtp("reset", { email })} />
        </form>
      </div>
    );
  }

  /* ---- one-time code entry ---- */
  if (stage === "otp") {
    return (
      <div className="animate-soft-fade max-w-[400px]">
        <h1 className="text-[30px] font-semibold leading-tight">Enter OTP</h1>
        <p className="mt-2 text-[14px] text-ink/70">
          We sent a 6-digit code to <b>{via === "phone" ? `+91 ${phone}` : email}</b>{" "}
          <button className="text-[#141413]" onClick={() => { setStage("id"); setError(undefined); }}>Edit</button>
        </p>
        <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); verify(); }}>
          <OtpBoxes value={otp} onChange={setOtp} onComplete={verify} />
          <DevOtpNote code={devOtp} />
          <ErrorText>{error}</ErrorText>
          <OrangeButton loading={loading}>Verify &amp; login</OrangeButton>
          <ResendTimer onResend={() => requestOtp("otp")} />
        </form>
      </div>
    );
  }

  /* ---- main screen: password or one-time code ---- */
  return (
    <div className="max-w-[400px]">
      <h1 className="text-[30px] font-semibold leading-tight">{admin ? "Admin sign-in" : "Continue to Nitienaa Rao"}</h1>
      <p className="mt-2 text-[14px] text-ink/80">{admin ? "For the platform administrator only." : "Welcome back! Please enter your details."}</p>
      {notice && <p className="mt-4 rounded-md bg-[#e9e6e0] px-3 py-2 text-[13px]">{notice}</p>}

      <div className="mt-8 grid grid-cols-2 gap-1 rounded-lg bg-[#f0eee9] p-1 text-[13.5px]" role="tablist">
        {(["password", "otp"] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={method === m} onClick={() => { setMethod(m); setError(undefined); setNotice(undefined); }} className={`rounded-md py-2 font-medium transition ${method === m ? "bg-white shadow-sm" : "text-ink/60"}`}>{m === "password" ? "Password" : "One-time code"}</button>
        ))}
      </div>

      <form className="mt-6 space-y-5" onSubmit={(e) => { e.preventDefault(); if (!ready) return; if (method === "password") { if (password) passwordLogin(); } else requestOtp("otp"); }}>
        {via === "phone" ? (
          <PhoneInput value={phone} onChange={setPhone} autoFocus />
        ) : (
          <input autoFocus className={inputCls} type="email" autoComplete="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
        )}
        {method === "password" && (
          <div>
            <div className="relative">
              <input className={`${inputCls} pr-16`} type={show ? "text" : "password"} autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] text-ink/70 underline">{show ? "Hide" : "Show"}</button>
            </div>
            <button type="button" className="mt-2 text-[12.5px] text-[#141413] underline" onClick={() => { setStage("forgot"); setError(undefined); setNotice(undefined); }}>Forgot password?</button>
          </div>
        )}
        <ErrorText>{error}</ErrorText>
        <OrangeButton disabled={!ready || (method === "password" && !password)} loading={loading}>{method === "password" ? "Sign in" : "Request OTP"}</OrangeButton>
        {!admin && (
          <p className="pt-1 text-center text-[13px] text-ink/80">
            OR,{" "}
            <button type="button" className="font-medium text-[#141413]" onClick={() => { setVia(via === "phone" ? "email" : "phone"); setError(undefined); }}>
              use {via === "phone" ? "email" : "phone number"} instead
            </button>
          </p>
        )}
        {!admin && (
          <p className="text-center text-[12px] text-ink/70">
            Not registered yet? <Link href="/signup" className="font-medium text-[#141413]">Sign Up</Link>
          </p>
        )}
      </form>
    </div>
  );
}
