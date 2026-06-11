import { NextResponse } from 'next/server';
import { listServices, saveService } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const services = await listServices();
    return NextResponse.json({ services });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { name, cat, price, duration, desc, hero, icon } = payload || {};

    if (!name || !cat) {
      return NextResponse.json(
        { error: 'name and cat (category) are required' },
        { status: 400 }
      );
    }

    const service = await saveService({
      name,
      cat,
      price: price !== undefined && price !== '' && price !== null ? Number(price) : null,
      duration: duration || '30 min',
      desc: desc || '',
      hero: hero || '',
      icon: icon || '',
    });

    return NextResponse.json({ ok: true, service }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
