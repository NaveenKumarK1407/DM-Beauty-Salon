import { NextResponse } from 'next/server';
import { listPackages, savePackage } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const packages = await listPackages();
    return NextResponse.json({ packages });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { name, tag, desc, includes, price, original, img } = payload || {};

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    const pkg = await savePackage({
      name,
      tag: tag || '',
      desc: desc || '',
      includes: Array.isArray(includes) ? includes : (includes ? String(includes).split(',').map(s => s.trim()).filter(Boolean) : []),
      price: price !== undefined && price !== '' && price !== null ? Number(price) : null,
      original: original !== undefined && original !== '' && original !== null ? Number(original) : null,
      img: img || '',
    });

    return NextResponse.json({ ok: true, package: pkg }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
