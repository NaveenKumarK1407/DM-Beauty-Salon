// PATCH /api/bookings/[id] — update status, date, or slot + notify admin & customer.

import { NextResponse } from 'next/server';
import { getBooking, updateBooking } from '@/lib/store';
import { notifyBookingUpdated } from '@/lib/bookingNotify.js';
import { getCustomerWhatsAppHref } from '@/lib/whatsapp.js';
import { getStudioSettings } from '@/lib/store';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['pending', 'confirmed', 'done', 'cancelled'];

function detectEvent(previous, patch) {
  if (patch.status === 'cancelled') return 'cancelled';
  if (patch.status === 'done') return 'done';
  if (patch.status === 'confirmed') return 'confirmed';
  if (patch.date !== undefined || patch.slot !== undefined) {
    const dateChanged = patch.date !== undefined && patch.date !== previous.date;
    const slotChanged = patch.slot !== undefined && patch.slot !== previous.slot;
    if (dateChanged || slotChanged) return 'rescheduled';
  }
  if (patch.status) return patch.status;
  return 'pending';
}

export async function PATCH(request, { params }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });

  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status, date, slot } = payload || {};
  const patch = {};

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    patch.status = status;
  }
  if (date !== undefined && date !== null) patch.date = date;
  if (slot !== undefined && slot !== null) patch.slot = slot;

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  try {
    const previous = await getBooking(id);
    if (!previous) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = await updateBooking(id, patch);
    if (!booking) {
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    const event = detectEvent(previous, patch);
    const notify = await notifyBookingUpdated(booking, {
      event,
      previous: { date: previous.date, slot: previous.slot, status: previous.status },
    });

    const settings = await getStudioSettings();
    const customerWhatsApp = getCustomerWhatsAppHref(booking, settings, event === 'rescheduled' ? 'rescheduled' : event);

    return NextResponse.json({
      ok: true,
      id,
      ...patch,
      booking,
      notify,
      customerWhatsApp,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
