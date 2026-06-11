// POST /api/notifications/subscribe — register an FCM device token so the
// studio receives push notifications for new bookings and enquiries.

import { NextResponse } from 'next/server';
import { saveToken } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { token, agent } = payload || {};
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  await saveToken(token, { agent: agent || null });
  return NextResponse.json({ ok: true });
}
