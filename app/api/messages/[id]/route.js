// PATCH /api/messages/[id] — update a message (status: read / archived).
// DELETE /api/messages/[id] — remove a message.

import { NextResponse } from 'next/server';
import { updateMessage, deleteMessage } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  const { id } = await params;
  let payload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const patch = {};
  if (payload.status) patch.status = payload.status;
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }
  await updateMessage(id, patch);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  await deleteMessage(id);
  return NextResponse.json({ ok: true });
}
