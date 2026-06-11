// GET /api/messages — list contact-form messages for the admin dashboard.

import { NextResponse } from 'next/server';
import { listMessages } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const messages = await listMessages(200);
  return NextResponse.json({ messages });
}
