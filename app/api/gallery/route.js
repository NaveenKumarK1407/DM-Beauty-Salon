import { NextResponse } from 'next/server';
import { listGallery, saveGalleryItem } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const gallery = await listGallery();
    return NextResponse.json({ gallery });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { title, cat, src } = payload || {};

    if (!cat || !src) {
      return NextResponse.json(
        { error: 'cat (category) and src (Base64 image/URL) are required' },
        { status: 400 }
      );
    }

    const item = await saveGalleryItem({
      title: title || '',
      cat,
      src,
    });

    return NextResponse.json({ ok: true, item }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
