// POST /api/contact — store a contact-form message and notify the studio.

import { NextResponse } from 'next/server';
import { saveMessage } from '@/lib/store';
import { notifyStudio } from '@/lib/notify';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, email, service, message } = payload || {};
  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'name, email and message are required' },
      { status: 400 }
    );
  }

  const saved = await saveMessage({
    name,
    email,
    service: service || 'General enquiry',
    message,
    status: 'new',
  });

  await notifyStudio({
    title: 'New enquiry · ' + (service || 'General'),
    body: `${name}: ${String(message).slice(0, 80)}`,
    data: { type: 'message', messageId: saved.id },
  });

  return NextResponse.json({ ok: true, message: saved }, { status: 201 });
}
