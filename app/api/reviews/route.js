import { NextResponse } from 'next/server';
import { listReviews, saveReview } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const reviews = await listReviews();
    return NextResponse.json({ reviews });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { name, role, stars, quote } = payload || {};

    if (!name || !quote) {
      return NextResponse.json(
        { error: 'name and quote are required' },
        { status: 400 }
      );
    }

    const review = await saveReview({
      name,
      role: role || '',
      stars: Math.min(5, Math.max(1, Number(stars) || 5)),
      quote,
    });

    return NextResponse.json({ ok: true, review }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
