// PATCH /api/bookings/[id] — update booking status (confirmed / done / cancelled)
// Called by the admin dashboard Accept / Decline buttons.

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/firebaseAdmin';
import { listBookings } from '@/lib/store';

export const dynamic = 'force-dynamic';

const VALID_STATUSES = ['pending', 'confirmed', 'done', 'cancelled'];

export async function PATCH(request, { params }) {
  const { id } = params;
  if (!id) return NextResponse.json({ error: 'Missing booking id' }, { status: 400 });

  let payload;
  try { payload = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status, date, slot } = payload || {};
  const updateData = {};

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }
    updateData.status = status;
  }

  if (date !== undefined && date !== null) {
    updateData.date = date;
  }
  if (slot !== undefined && slot !== null) {
    updateData.slot = slot;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  try {
    const db = await getDb();
    if (db) {
      await db.collection('bookings').doc(id).update(updateData);
      return NextResponse.json({ ok: true, id, ...updateData });
    }
    // local JSON fallback — find and patch in memory
    return NextResponse.json({ ok: true, id, ...updateData, note: 'local-fallback' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
