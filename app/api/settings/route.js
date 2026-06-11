import { NextResponse } from 'next/server';
import { getStudioSettings, saveStudioSettings } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getStudioSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const settings = await saveStudioSettings(body);
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
