import { NextResponse } from 'next/server';
import { deletePayment, updatePayment } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
  }

  try {
    await deletePayment(id);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing payment id' }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const { title, amount, date, time, paidBy } = payload || {};

    const patch = {};
    if (title !== undefined) patch.title = title;
    if (amount !== undefined) patch.amount = Number(amount);
    if (date !== undefined) patch.date = date;
    if (time !== undefined) patch.time = time;
    if (paidBy !== undefined) patch.paidBy = paidBy;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    await updatePayment(id, patch);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
