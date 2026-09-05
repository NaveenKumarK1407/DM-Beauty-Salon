// POST /api/bookings  — create a booking, persist it, notify admin + customer.
// GET  /api/bookings   — list recent bookings (used by the admin dashboard).

import { NextResponse } from 'next/server';
import { saveBooking, listBookings } from '@/lib/store';
import { notifyBookingCreated } from '@/lib/bookingNotify.js';
import { getPhoneValidationError, normalizePhoneDigits } from '@/lib/utils';

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

  const phoneError = getPhoneValidationError(phone);
  if (phoneError) {
    return NextResponse.json({ error: phoneError }, { status: 400 });
  }
  const phoneNormalized = normalizePhoneDigits(phone);

  const reference = makeRef();
  const booking = await saveBooking({
    reference,
    serviceId,
    serviceName: serviceName || serviceId,
    date: date || null,
    slot: slot || null,
    name,
    phone: `+91 ${phoneNormalized}`,
    email: email || null,
    notes: notes || null,
    price: price ?? null,
    status: 'pending',
  });

  const notify = await notifyBookingCreated(booking);

  return NextResponse.json({ ok: true, reference, booking, notify }, { status: 201 });
}

export async function GET() {
  const bookings = await listBookings(100);
  return NextResponse.json({ bookings });
}
