// POST /api/contact — store enquiry + notify admin.

import { NextResponse } from 'next/server';
import { saveMessage, getStudioSettings } from '@/lib/store';
import { notifyNewMessage } from '@/lib/bookingNotify.js';
import { getWhatsAppHref } from '@/lib/whatsapp.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, email, phone, service, message } = payload || {};
  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'name, email and message are required' },
      { status: 400 }
    );
  }

  const saved = await saveMessage({
    name,
    email,
    phone: phone || null,
    service: service || 'General enquiry',
    message,
    status: 'new',
  });

  const notify = await notifyNewMessage(saved);

  const settings = await getStudioSettings();
  const studioWhatsApp = getWhatsAppHref(
    settings?.phone,
    `Hi! I sent an enquiry via the website.\n\nName: ${name}\nService: ${service || 'General'}\nMessage: ${message}`
  );

  return NextResponse.json({
    ok: true,
    message: saved,
    notify,
    studioWhatsApp,
    copy: 'We received your message. For a faster reply, message us on WhatsApp.',
  }, { status: 201 });
}
