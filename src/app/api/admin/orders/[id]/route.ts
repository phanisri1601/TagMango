import { NextResponse } from "next/server";
import { now, store } from "@/lib/db";
import { deny, logAudit, notify, requireAdmin } from "@/lib/admin";

/** Refund an order (or restore it). In this clone no money moves — the status and records change. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  if (!admin) return deny();
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  if (body.status !== "Refunded" && body.status !== "Success") return NextResponse.json({ error: "Status must be Refunded or Success" }, { status: 400 });
  try {
    await store.tx(async (t) => {
      const s = await t.get("sales", id);
      if (!s) throw new Error("Order not found");
      if (s.status === body.status) throw new Error(`Order is already ${String(s.status).toLowerCase()}`);
      const before = s.status;
      t.update("sales", id, { status: body.status, updatedAt: now(), adminNote: String(body.note || "").slice(0, 200) || undefined });
      const amt = `₹${Number(s.amount || 0).toLocaleString("en-IN")}`;
      notify(t, String(s.userId), body.status === "Refunded" ? `Order refunded by TagMango: ${String(s.customer)} · ${String(s.mango)} · ${amt}` : `Order restored: ${String(s.customer)} · ${String(s.mango)} · ${amt}`);
      logAudit(t, admin, body.status === "Refunded" ? "order.refund" : "order.restore", `${String(s.customer)} · ${String(s.mango)}`, `${amt}, was ${String(before)}`);
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
