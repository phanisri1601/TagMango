import "server-only";
import { MIN_PLAN, PLAN_ORDER, COMMISSION, PLAN_LIMITS, PLAN_LABEL, LIMIT_LABEL, type LimitKey } from "@/components/dash/nav";
import type { Plan, User } from "./db";

export const planOf = (u: Pick<User, "plan"> | null | undefined): Plan => u?.plan || "basic";
export const rateFor = (u: Pick<User, "plan"> | null | undefined) => COMMISSION[planOf(u)] ?? 0.1;

/** True if the creator's plan includes `feature` (see MIN_PLAN in nav.ts). Unknown features are open. */
export const hasFeature = (u: Pick<User, "plan"> | null | undefined, feature: string) => {
  const need = MIN_PLAN[feature];
  return !need || PLAN_ORDER.indexOf(planOf(u)) >= PLAN_ORDER.indexOf(need);
};

/** Self-service plan change without a payment gateway. On in development, off in production unless ENABLE_TEST_BILLING=1. */
export const testBilling = () => process.env.ENABLE_TEST_BILLING === "1" || (process.env.NODE_ENV !== "production" && process.env.ENABLE_TEST_BILLING !== "0");
/** KYC always goes through the review flow (assign, review, final decision) unless KYC_AUTO_APPROVE=1 is set for quick local testing. */
export const kycAutoApprove = () => process.env.KYC_AUTO_APPROVE === "1";

export const limitOf = (u: Pick<User, "plan"> | null | undefined, k: LimitKey) => PLAN_LIMITS[planOf(u)][k];

/** Rule check for creating one more `coll` row: stops at the plan's limit with a message that says what to do. */
export const limitCheck = (coll: string, key: LimitKey) => async (c: { me: User; t: { find(coll: string, f?: [string, unknown][]): Promise<unknown[]> } }, op: "c" | "u") => {
  if (op !== "c") return;
  const max = limitOf(c.me, key);
  if (max >= 1e9) return;
  const have = (await c.t.find(coll, [["userId", c.me.id]])).length;
  if (have >= max) return `Your ${PLAN_LABEL[planOf(c.me)]} plan allows ${max === 0 ? "no" : `up to ${max}`} ${LIMIT_LABEL[key]}. Upgrade your plan to add more.`;
};
