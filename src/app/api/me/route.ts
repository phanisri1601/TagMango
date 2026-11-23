import { NextResponse } from "next/server";
import { asUser, id, now, PLANS, store, type Kyc, type Plan } from "@/lib/db";
import { currentUser, selfView } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { hasFeature, kycAutoApprove, testBilling } from "@/lib/plans";

const PLAN_PRICE: Record<Plan, number> = { basic: 0, pro: 5000, advanced: 15000, ultimate: 35000 };

/** Creator-writable settings keys, and the plan feature each one needs. `apiKeys` is only written by /api/apikeys. */
const SETTING_FEATURE: Record<string, string | null> = {
  gcal: null,
  overlappingSlots: null,
  store: null,
  email: null,
  points: "points",
  gamification: "gamification-settings",
  menu: "platform-menu",
  branding: "platform-branding",
  domain: "platform-branding",
  waEvents: "whatsapp-event-mapping",
  waAccount: "whatsapp-account-management",
  maxDevices: "restrict-login-devices",
};

const view = (u: Parameters<typeof selfView>[0]) => ({ ...selfView(u), isAdmin: isAdminUser(u) });
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  return NextResponse.json({ user: view(user) });
}

/** Update profile fields: name, about, bank, kyc (submit), settings (whitelisted, merged), plan / whiteLabel (test billing only). */
export async function PATCH(req: Request) {
  const me = await currentUser();
  if (!me) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    const user = await store.tx(async (t) => {
      const u = asUser(await t.get("users", me.id));
      if (!u) throw new Error("Account not found");
      const patch: Record<string, unknown> = {};

      if (typeof body.name === "string" && body.name.trim()) patch.name = str(body.name, 80);

      if (isObj(body.about)) {
        patch.about = { ...u.about, category: str(body.about.category ?? u.about?.category, 80), audience: str(body.about.audience ?? u.about?.audience, 80), goal: str(body.about.goal ?? u.about?.goal, 80) };
      }

      if (isObj(body.bank)) {
        const { holder, account, ifsc } = body.bank;
        if (!str(holder, 80) || !/^\d{9,18}$/.test(String(account)) || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(String(ifsc))) {
          throw new Error("Enter a valid account number (9–18 digits) and IFSC (e.g. HDFC0001234)");
        }
        patch.bank = { holder: str(holder, 80), account: String(account), ifsc: String(ifsc).toUpperCase() };
      }

      if (isObj(body.kyc)) {
        // Step 1 of the KYC flow: the creator submits personal details and identity documents.
        const cur = u.kyc?.status;
        if (cur === "verified") throw new Error("Your KYC is already verified");
        if (cur === "pending" || cur === "assigned" || cur === "reviewed") throw new Error("Your KYC is already under review");
        const pan = str(body.kyc.pan, 10).toUpperCase();
        const legalName = str(body.kyc.legalName, 80);
        const dob = str(body.kyc.dob, 10);
        const address = str(body.kyc.address, 300);
        if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) throw new Error("Enter a valid PAN (e.g. ABCDE1234F)");
        if (!legalName) throw new Error("Enter your name as on the PAN card");
        const born = new Date(`${dob}T00:00:00Z`).getTime();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(born)) throw new Error("Enter your date of birth");
        if (Date.now() - born < 18 * 365.25 * 864e5) throw new Error("You must be at least 18 to complete KYC");
        if (address.length < 10) throw new Error("Enter your full address");
        const d = isObj(body.kyc.docs) ? body.kyc.docs : {};
        const idType = ["Aadhaar", "Passport", "Driving licence", "Voter ID"].includes(String(d.idType)) ? String(d.idType) : "";
        const ids = { pan: str(d.pan, 40), id: str(d.id, 40), selfie: str(d.selfie, 40) };
        if (!ids.pan) throw new Error("Upload a photo or PDF of your PAN card");
        if (!idType || !ids.id) throw new Error("Choose an ID proof and upload it");
        for (const fid of [ids.pan, ids.id, ids.selfie].filter(Boolean)) {
          const f = await t.get("cloud", fid);
          if (!f || f.userId !== u.id) throw new Error("One of the uploaded documents was not found. Please upload it again.");
          t.update("cloud", fid, { private: true });
        }
        const submittedAt = now();
        const auto = kycAutoApprove();
        const kyc: Kyc = {
          pan, legalName, dob, address, phone: u.phone, status: auto ? "verified" : "pending", submittedAt,
          docs: { pan: ids.pan, id: ids.id, idType, ...(ids.selfie && { selfie: ids.selfie }) },
          history: [...(u.kyc?.history || []), { at: submittedAt, by: u.email, role: "creator" as const, action: cur ? "Resubmitted KYC" : "Submitted KYC" }].slice(-50),
        };
        patch.kyc = kyc;
        patch.kycDone = auto;
      }

      if (isObj(body.settings)) {
        const settings = { ...u.settings };
        for (const [k, v] of Object.entries(body.settings)) {
          if (!(k in SETTING_FEATURE)) continue; // unknown or server-only keys are ignored
          const feat = SETTING_FEATURE[k];
          if (feat && !hasFeature(u, feat)) throw new Error("Upgrade your plan to change this setting");
          if (JSON.stringify(v ?? null).length > 20000) throw new Error("Setting is too large");
          if (k === "maxDevices") {
            const n = Number(v);
            if (!Number.isInteger(n) || n < 0 || n > 20) throw new Error("Device limit must be between 0 and 20");
            settings[k] = n;
          } else settings[k] = v;
        }
        patch.settings = settings;
      }

      if (body.plan !== undefined || body.whiteLabel === true) {
        if (!testBilling()) throw new Error("Plan changes need a payment — contact support to upgrade");
        if (body.plan !== undefined) {
          if (!(PLANS as readonly string[]).includes(body.plan)) throw new Error("Unknown plan");
          const plan = body.plan as Plan;
          if (plan !== (u.plan || "basic")) {
            patch.plan = plan;
            t.set("invoices", id(), { userId: u.id, createdAt: now(), number: `TM-${Date.now().toString().slice(-8)}`, product: `${plan[0].toUpperCase() + plan.slice(1)} plan`, amount: Math.round(PLAN_PRICE[plan] * 1.18), status: "Paid (test)" });
          }
        }
        if (body.whiteLabel === true && !u.whiteLabel) {
          patch.whiteLabel = true;
          t.set("invoices", id(), { userId: u.id, createdAt: now(), number: `TM-${Date.now().toString().slice(-8)}`, product: "Freedom Setup", amount: Math.round(24999 * 1.18), status: "Paid (test)" });
        }
      }

      if (Object.keys(patch).length) t.update("users", u.id, patch);
      return view({ ...u, ...patch } as typeof u);
    });
    return NextResponse.json({ user });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
