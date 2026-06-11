import { NextResponse } from 'next/server';
import { deletePackage, updatePackage } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing package id' }, { status: 400 });
  }

  try {
    await deletePackage(id);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing package id' }, { status: 400 });
  }

  try {
    const payload = await request.json();
    const { name, tag, desc, includes, price, original, img } = payload || {};

    const patch = {};
    if (name !== undefined) patch.name = name;
    if (tag !== undefined) patch.tag = tag;
    if (desc !== undefined) patch.desc = desc;
    if (includes !== undefined) patch.includes = Array.isArray(includes) ? includes : String(includes).split(',').map(s => s.trim()).filter(Boolean);
    if (price !== undefined) patch.price = price !== '' && price !== null ? Number(price) : null;
    if (original !== undefined) patch.original = original !== '' && original !== null ? Number(original) : null;
    if (img !== undefined) patch.img = img;

    await updatePackage(id, patch);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
