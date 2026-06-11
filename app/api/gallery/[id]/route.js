import { NextResponse } from 'next/server';
import { deleteGalleryItem } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  const { id } = params;
  if (!id) {
    return NextResponse.json({ error: 'Missing gallery item id' }, { status: 400 });
  }

  try {
    await deleteGalleryItem(id);
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
