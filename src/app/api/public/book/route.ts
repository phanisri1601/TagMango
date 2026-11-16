import { NextResponse } from "next/server";
import { id, now, tx } from "@/lib/db";

/** Book a 1-1 consultation slot from the public booking page. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const phone = String(body.phone || "").replace(/\D/g, "").slice(-10);
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "Enter your name and a valid email" }, { status: 400 });
  try {
    const booking = await tx((db) => {
      const ev = (db.rows.events || []).find((e) => e.id === body.eventId && e.active !== false);
      if (!ev) throw new Error("This event isn't available");
      const slots = (ev.slots as string[]) || [];
      if (!slots.includes(body.slot)) throw new Error("Pick one of the available slots");
      if (new Date(body.slot).getTime() < Date.now()) throw new Error("That slot is in the past");
      const all = (db.rows.bookings || []).filter((b) => b.userId === ev.userId && b.status !== "Cancelled");
      const owner = db.users.find((u) => u.id === ev.userId);
      const overlap = Boolean(owner?.settings?.overlappingSlots);
      if (!overlap && all.some((b) => b.slot === body.slot)) throw new Error("That slot was just booked. Pick another.");
      const perUser = Number(ev.slotsPerUser || 1);
      if (all.filter((b) => b.eventId === ev.id && b.email === email).length >= perUser) throw new Error(`You can book up to ${perUser} slot(s) for this event`);
      const b = { id: id(), userId: ev.userId, createdAt: now(), eventId: ev.id, event: ev.title, slot: body.slot, duration: ev.duration, name, email, phone, status: "Confirmed", link: ev.link };
      (db.rows.bookings ||= []).push(b);
      (db.rows.notifications ||= []).push({ id: id(), userId: ev.userId, createdAt: now(), read: false, text: `New booking: ${name} booked “${ev.title}”` });
      return b;
    });
    return NextResponse.json({ ok: true, booking: { slot: booking.slot, event: booking.event, link: booking.link } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
