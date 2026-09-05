// POST /api/notifications/subscribe — register FCM token (admin or customer).

import { NextResponse } from 'next/server';
import { saveToken } from '@/lib/store';
import { normalizePhoneDigits, getPhoneValidationError } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { token, agent, role = 'admin', phone } = payload || {};
  if (!token) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  if (role === 'customer') {
    const phoneError = getPhoneValidationError(phone);
    if (phoneError) {
      return NextResponse.json({ error: phoneError }, { status: 400 });
    }
    await saveToken(token, {
      role: 'customer',
      phone: normalizePhoneDigits(phone),
      agent: agent || null,
    });
    return NextResponse.json({ ok: true, role: 'customer' });
  }

  await saveToken(token, { role: 'admin', agent: agent || null });
  return NextResponse.json({ ok: true, role: 'admin' });
}
