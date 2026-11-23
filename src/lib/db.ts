import "server-only";
import crypto from "crypto";
import { authCache, store } from "./store";
import type { Reader } from "./store";

export { store, authCache };

export const PLANS = ["basic", "pro", "advanced", "ultimate"] as const;
export type Plan = (typeof PLANS)[number];

/** KYC case. pending = submitted, assigned = with a reviewer, reviewed = reviewer's recommendation is in, then the super admin decides: verified, rejected or resubmit. */
export type KycStatus = "pending" | "assigned" | "reviewed" | "verified" | "rejected" | "resubmit";
export type KycEvent = { at: string; by: string; role: "creator" | "admin" | "reviewer"; action: string; note?: string };
export type Kyc = {
  pan: string; legalName: string; status: KycStatus; submittedAt: string; note?: string;
  dob?: string; address?: string; phone?: string;
  /** Cloud file ids of the uploaded documents (private: only the owner, the assigned reviewer and admins can open them). */
  docs?: { pan?: string; id?: string; idType?: string; selfie?: string };
  reviewerId?: string; reviewerEmail?: string; reviewerName?: string; assignedAt?: string; assignedBy?: string;
  reviewedBy?: string; reviewedAt?: string; reviewerRemarks?: string; recommendation?: "approve" | "corrections";
  finalBy?: string; finalAt?: string;
  history?: KycEvent[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  marketingOptIn: boolean;
  about?: { category?: string; audience?: string; goal?: string };
  kycDone?: boolean;
  kyc?: Kyc;
  bank?: { holder: string; account: string; ifsc: string };
  plan?: Plan;
  whiteLabel?: boolean;
  role?: "learner";
  suspended?: boolean;
  suspendReason?: string;
  passwordHash?: string;
  pwFails?: number;
  pwLockUntil?: number;
  adminNote?: string;
  settings?: Record<string, unknown>;
  createdAt: string;
};

export type Row = { id: string; userId: string; createdAt: string; [k: string]: unknown };
export type Session = { id: string; userId: string; createdAt: string; lastSeen?: string; userAgent?: string; ip?: string };

export const id = () => crypto.randomBytes(9).toString("base64url");
export const now = () => new Date().toISOString();
export const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

/** In-memory view over several collections, for admin screens that aggregate across all creators. */
export type Snap = { users: User[]; sessions: Session[]; rows: Record<string, Row[]> };

export async function loadSnap(rows: string[] = [], opts: { sessions?: boolean } = {}, r: Reader = store): Promise<Snap> {
  const [users, sessions, ...lists] = await Promise.all([
    r.find("users"),
    opts.sessions ? r.find("sessions") : Promise.resolve([]),
    ...rows.map((c) => r.find(c)),
  ]);
  return {
    users: users as unknown as User[],
    sessions: sessions as unknown as Session[],
    rows: Object.fromEntries(rows.map((c, i) => [c, lists[i] as unknown as Row[]])),
  };
}

export const byNewest = <T extends { createdAt: string }>(a: T, b: T) => b.createdAt.localeCompare(a.createdAt);
export const asRows = (docs: unknown[]) => docs as Row[];
export const asUser = (d: unknown) => d as User;
