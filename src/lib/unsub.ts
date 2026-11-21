import "server-only";
import crypto from "crypto";

const secret = () => process.env.UNSUB_SECRET || process.env.CRON_SECRET || process.env.FIREBASE_PRIVATE_KEY?.slice(0, 40) || "dev-unsub-secret";
/** Signed token so only the person who got the email can unsubscribe that address. */
export const unsubToken = (creatorId: string, email: string) => crypto.createHmac("sha256", secret()).update(`${creatorId}|${email.toLowerCase()}`).digest("hex").slice(0, 32);
export const unsubOk = (creatorId: string, email: string, t: string) => t.length === 32 && crypto.timingSafeEqual(Buffer.from(unsubToken(creatorId, email)), Buffer.from(t));
