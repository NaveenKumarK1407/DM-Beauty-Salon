// GET /api/cron/appointment-reminders
// Run daily at 8 PM IST — reminds admin + customers about today/tomorrow appointments.
// Secure with CRON_SECRET header. Add ?force=1 to test outside 8 PM window.

import { NextResponse } from 'next/server';
import { sendEveningReminders } from '@/lib/bookingNotify.js';
import { getIstNow } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : request.headers.get('x-cron-secret');

  if (secret && token !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get('force') === '1';
  const ist = getIstNow();
  const hour = ist.getHours();

  if (!force && hour !== 20) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'Outside 8 PM IST window',
      istHour: hour,
      hint: 'Use ?force=1 to run manually',
    });
  }

  const results = await sendEveningReminders();
  return NextResponse.json({ ok: true, istHour: hour, ...results });
}
