import "server-only";
import crypto from "crypto";

const base = "https://api.razorpay.com/v1";
export const razorpayConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
export const razorpayKeyId = () => process.env.RAZORPAY_KEY_ID || "";
const auth = () => "Basic " + Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(base + path, { ...init, headers: { authorization: auth(), "content-type": "application/json", ...(init?.headers || {}) }, cache: "no-store" });
  const j = (await r.json().catch(() => ({}))) as { error?: { description?: string } } & T;
  if (!r.ok) throw new Error(j.error?.description || `Razorpay error ${r.status}`);
  return j;
}

/** Amount is in rupees; Razorpay wants paise. `receipt` max 40 chars. */
export const createOrder = (rupees: number, receipt: string, notes: Record<string, string> = {}) =>
  call<{ id: string; amount: number; currency: string }>("/orders", { method: "POST", body: JSON.stringify({ amount: Math.round(rupees * 100), currency: "INR", receipt: receipt.slice(0, 40), notes }) });

export const fetchPayment = (paymentId: string) => call<{ id: string; order_id: string; status: string; method?: string; amount: number }>(`/payments/${encodeURIComponent(paymentId)}`);

export const refundPayment = (paymentId: string, rupees: number, notes: Record<string, string> = {}) =>
  call<{ id: string; status: string }>(`/payments/${encodeURIComponent(paymentId)}/refund`, { method: "POST", body: JSON.stringify({ amount: Math.round(rupees * 100), speed: "normal", notes }) });

const safeEq = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

/** Checks the signature Razorpay's checkout returns: HMAC-SHA256(order_id|payment_id) with the key secret. */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const want = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(`${orderId}|${paymentId}`).digest("hex");
  return safeEq(want, String(signature || ""));
}

/** Webhook body signature (header x-razorpay-signature). */
export function verifyWebhook(raw: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  return safeEq(crypto.createHmac("sha256", secret).update(raw).digest("hex"), String(signature || ""));
}
