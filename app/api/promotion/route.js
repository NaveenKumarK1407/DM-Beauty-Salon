import { NextResponse } from 'next/server';
import { getHomepagePromotion, saveHomepagePromotion } from '@/lib/store';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json({ promotion: await getHomepagePromotion() });
  } catch {
    return NextResponse.json({ error: 'Could not load the homepage popup.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await getAdminAuth();
    if (!auth) return NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 503 });
    const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
    try {
      if (!token) throw new Error('Missing token');
      // This studio uses a single Firebase email/password admin account.
      await auth.verifyIdToken(token, true);
    } catch {
      return NextResponse.json({ error: 'Please sign in again to save your popup.' }, { status: 401 });
    }
    const raw = await request.text();
    if (raw.length > 750000) return NextResponse.json({ error: 'Image is too large. Please choose a smaller image.' }, { status: 413 });
    let body;
    try { body = JSON.parse(raw); } catch {
      return NextResponse.json({ error: 'Invalid popup data.' }, { status: 400 });
    }
    if (!body || typeof body.enabled !== 'boolean' || typeof body.image !== 'string' ||
        (body.title !== undefined && (typeof body.title !== 'string' || body.title.length > 160)) ||
        (body.image && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(body.image)) ||
        (body.enabled && !body.image)) {
      return NextResponse.json({ error: 'Choose a valid image before enabling the popup. The optional description must be 160 characters or fewer.' }, { status: 400 });
    }
    const promotion = await saveHomepagePromotion({ enabled: body.enabled, image: body.image, title: (body.title || '').trim() });
    return NextResponse.json({ promotion });
  } catch {
    return NextResponse.json({ error: 'Could not save the popup. Please try again.' }, { status: 500 });
  }
}
