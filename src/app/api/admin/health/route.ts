import { NextResponse } from "next/server";
import { store } from "@/lib/db";
import { deny, requireAdmin } from "@/lib/admin";
import { emailConfigured, smsConfigured } from "@/lib/messaging";

const has = (...k: string[]) => k.every((x) => Boolean(process.env[x]));

/** Which integrations are connected, without ever returning a secret value. */
export async function GET() {
  if (!(await requireAdmin())) return deny();
  const items = [
    { key: "database", label: "Database", detail: store.kind === "firestore" ? "Firebase Firestore" : "Local JSON file (not for production)", ok: store.kind === "firestore", fix: "Set the FIREBASE_* variables" },
    { key: "payments", label: "Payments (Razorpay)", detail: process.env.RAZORPAY_KEY_ID?.startsWith("rzp_live") ? "Live mode" : "Test mode", ok: has("RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"), fix: "Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET" },
    { key: "files", label: "Files and video (Cloudinary)", detail: process.env.CLOUDINARY_CLOUD_NAME || "", ok: has("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"), fix: "Set the CLOUDINARY_* variables" },
    { key: "email", label: "Email", detail: emailConfigured() ? "Connected" : "", ok: emailConfigured(), fix: "Set the EmailJS or SMTP variables" },
    { key: "whatsapp", label: "WhatsApp (Twilio)", detail: smsConfigured() ? "Connected (sandbox until Meta approval)" : "", ok: smsConfigured(), fix: "Set the TWILIO_* variables" },
    { key: "cron", label: "Daily scheduler", detail: "Call /api/cron/run with the CRON_SECRET", ok: has("CRON_SECRET"), fix: "Set CRON_SECRET and add a daily call on your host" },
    { key: "url", label: "Public site address", detail: process.env.NEXT_PUBLIC_APP_URL || "", ok: has("NEXT_PUBLIC_APP_URL"), fix: "Set NEXT_PUBLIC_APP_URL to your live address" },
    { key: "admins", label: "Admin emails", detail: `${(process.env.ADMIN_EMAILS || "").split(",").filter(Boolean).length} configured`, ok: has("ADMIN_EMAILS"), fix: "Set ADMIN_EMAILS" },
  ];
  return NextResponse.json({ items, checkedAt: new Date().toISOString() });
}
