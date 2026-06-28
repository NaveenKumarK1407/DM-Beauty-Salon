import { NextResponse } from 'next/server';
import { getAdminManifest } from '@/lib/pwa_manifest';

export function GET() {
  return NextResponse.json(getAdminManifest(), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
