import { NextResponse } from 'next/server';
import { deleteService, updateService } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
  }

  try {
    await deleteService(id);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const { name, cat, price, duration, desc, hero, icon, available } = payload || {};

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (cat !== undefined) patch.cat = cat;
    if (price !== undefined) patch.price = price !== '' && price !== null ? Number(price) : null;
    if (duration !== undefined) patch.duration = duration;
    if (desc !== undefined) patch.desc = desc;
    if (hero !== undefined) patch.hero = hero;
    if (icon !== undefined) patch.icon = icon;
    if (available !== undefined) patch.available = !!available;

    await updateService(id, patch);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
