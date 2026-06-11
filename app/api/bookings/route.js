// POST /api/bookings  — create a booking, persist it, notify the studio.
// GET  /api/bookings   — list recent bookings (used by the admin dashboard).

import { NextResponse } from 'next/server';
import { saveBooking, listBookings } from '@/lib/store';
import { notifyStudio } from '@/lib/notify';

export const dynamic = 'force-dynamic';

function makeRef() {
  return 'DMB-' + Math.floor(10000 + Math.random() * 89999);
}

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { serviceId, serviceName, date, slot, name, phone, email, notes, price } = payload || {};

  if (!serviceId || !name || !phone) {
    return NextResponse.json(
      { error: 'serviceId, name and phone are required' },
      { status: 400 }
    );
  }

  const reference = makeRef();
  const booking = await saveBooking({
    reference,
    serviceId,
    serviceName: serviceName || serviceId,
    date: date || null,
    slot: slot || null,
    name,
    phone,
    email: email || null,
    notes: notes || null,
    price: price ?? null,
    status: 'pending',
  });

  const notify = await notifyStudio({
    title: 'New booking · ' + (serviceName || serviceId),
    body: `${name} — ${date || 'date TBD'}${slot ? ' at ' + slot : ''} · ${reference}`,
    data: { type: 'booking', reference, bookingId: booking.id },
  });

  return NextResponse.json({ ok: true, reference, booking, notify }, { status: 201 });
}

export async function GET() {
  const bookings = await listBookings(100);
  return NextResponse.json({ bookings });
}
