import "server-only";
import { store, type Kyc, type KycEvent, type User } from "./db";

export const IN_REVIEW = ["pending", "assigned", "reviewed"];

/** Add one line to a case's history (who did what, and when). */
export const withEvent = (k: Kyc, e: Omit<KycEvent, "at">): KycEvent[] => [...(k.history || []), { at: new Date().toISOString(), ...e }].slice(-50);

export async function reviewerByEmail(email: string) {
  const [r] = await store.find("kycReviewers", [["email", email.trim().toLowerCase()]], { limit: 1 });
  return r || null;
}
export const isReviewer = async (u: Pick<User, "email"> | null | undefined) => (u ? !!(await reviewerByEmail(u.email)) : false);

/** The documents a case holds, as cloud file ids. */
export const kycDocIds = (k?: Kyc) => [k?.docs?.pan, k?.docs?.id, k?.docs?.selfie].filter(Boolean) as string[];

/** What a reviewer or admin sees about a case (full PAN, because they must check it against the card). */
export const caseView = (u: User) => {
  const k = u.kyc!;
  return {
    userId: u.id, name: u.name, email: u.email, phone: u.phone, status: k.status, submittedAt: k.submittedAt,
    pan: k.pan, legalName: k.legalName, dob: k.dob, address: k.address, docs: k.docs || {},
    reviewerId: k.reviewerId, reviewerEmail: k.reviewerEmail, reviewerName: k.reviewerName, assignedAt: k.assignedAt, assignedBy: k.assignedBy,
    reviewedBy: k.reviewedBy, reviewedAt: k.reviewedAt, reviewerRemarks: k.reviewerRemarks, recommendation: k.recommendation,
    finalBy: k.finalBy, finalAt: k.finalAt, note: k.note, history: k.history || [],
  };
};
