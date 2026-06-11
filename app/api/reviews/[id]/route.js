import { NextResponse } from 'next/server';
import { deleteReview, updateReview } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing review id' }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const { name, role, stars, quote } = payload || {};

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (role !== undefined) patch.role = role;
    if (stars !== undefined) patch.stars = Math.min(5, Math.max(1, Number(stars) || 5));
    if (quote !== undefined) patch.quote = quote;

    await updateReview(id, patch);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing review id' }, { status: 400 });
  }

  try {
    await deleteReview(id);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
