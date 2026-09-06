import { NextResponse } from 'next/server';
import {
  getHomepagePromotion,
  listHomepagePromotions,
  saveHomepagePromotion,
  deleteHomepagePromotion,
  promotionStatus,
} from '@/lib/store';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

const noStore = { headers: { 'Cache-Control': 'no-store' } };

// Every admin write goes through here: a valid ID token or nothing.
async function requireAdmin(request) {
  const auth = await getAdminAuth();
  if (!auth) return { error: NextResponse.json({ error: 'Admin authentication is not configured.' }, { status: 503 }) };
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  try {
    if (!token) throw new Error('Missing token');
    // This studio uses a single Firebase email/password admin account.
    await auth.verifyIdToken(token, true);
  } catch {
    return { error: NextResponse.json({ error: 'Please sign in again to save your popup.' }, { status: 401 }) };
  }
  return {};
}

function validate(body) {
  if (!body || typeof body !== 'object') return 'Invalid popup data.';
  if (typeof body.enabled !== 'boolean' || typeof body.image !== 'string') return 'Invalid popup data.';
  if (body.title !== undefined && (typeof body.title !== 'string' || body.title.length > 160)) {
    return 'The optional description must be 160 characters or fewer.';
  }
  if (body.image && !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(body.image)) {
    return 'Choose a valid JPG, PNG or WebP image.';
  }
  if (body.enabled && !body.image) return 'Choose an image before turning the popup on.';

  for (const key of ['startAt', 'endAt']) {
    const value = body[key];
    if (value == null || value === '') continue;
    if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return 'Enter a valid start and end date.';
  }
  if (body.startAt && body.endAt && Date.parse(body.endAt) <= Date.parse(body.startAt)) {
    return 'The end date must be after the start date.';
  }
  return null;
}

// GET            → the banner the homepage should show right now (or null)
// GET ?list=1    → every saved banner, with its schedule status (admin list)
// GET ?status=1  → just the fields the live popup polls, no image payload
export async function GET(request) {
  try {
    const params = new URL(request.url).searchParams;
    if (params.has('list')) {
      const now = Date.now();
      const promotions = (await listHomepagePromotions()).map((b) => ({ ...b, status: promotionStatus(b, now) }));
      return NextResponse.json({ promotions }, noStore);
    }
    let promotion = await getHomepagePromotion();
    if (promotion && params.has('status')) {
      promotion = { id: promotion.id, enabled: promotion.enabled, endAt: promotion.endAt ?? null, updatedAt: promotion.updatedAt };
    }
    return NextResponse.json({ promotion }, noStore);
  } catch {
    return NextResponse.json({ error: 'Could not load the homepage popup.' }, { status: 500 });
  }
}

// Create a banner, or update the one identified by body.id.
export async function PUT(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const raw = await request.text();
    if (raw.length > 750000) {
      return NextResponse.json({ error: 'Image is too large. Please choose a smaller image.' }, { status: 413 });
    }
    let body;
    try { body = JSON.parse(raw); } catch {
      return NextResponse.json({ error: 'Invalid popup data.' }, { status: 400 });
    }
    const invalid = validate(body);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    const promotion = await saveHomepagePromotion({
      ...(body.id ? { id: String(body.id) } : {}),
      enabled: body.enabled,
      image: body.image,
      title: (body.title || '').trim(),
      startAt: body.startAt || null,
      endAt: body.endAt || null,
    });
    return NextResponse.json({ promotion: { ...promotion, status: promotionStatus(promotion) } }, noStore);
  } catch {
    return NextResponse.json({ error: 'Could not save the popup. Please try again.' }, { status: 500 });
  }
}

// Remove a banner outright, so it stops appearing everywhere.
export async function DELETE(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Which popup should be deleted?' }, { status: 400 });
    await deleteHomepagePromotion(id);
    return NextResponse.json({ ok: true }, noStore);
  } catch {
    return NextResponse.json({ error: 'Could not delete the popup. Please try again.' }, { status: 500 });
  }
}
