// GET /api/firebase-messaging-sw
// Serves the Firebase Cloud Messaging service worker dynamically.
// Config values are injected from server-side env vars at request time —
// they never sit as a static file in /public for anyone to stumble upon.
//
// The browser still receives the values (required for FCM to work), but
// they are not pre-exposed as a plain static asset.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const config = {
    apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || '',
    authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || '',
    projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || '',
    storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || '',
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
    appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || '',
  };

  const script = `
/* Firebase Cloud Messaging — background push handler.
 * Served dynamically. Config injected server-side from env vars.
 */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp(${JSON.stringify(config, null, 2)});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  self.registration.showNotification(n.title || 'DM Beauty', {
    body:  n.body  || '',
    icon:  '/icon-192.png',
    badge: '/icon-192.png',
    data:  payload.data || {},
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/admin'));
});
`.trim();

  return new NextResponse(script, {
    status: 200,
    headers: {
      'Content-Type':         'application/javascript; charset=utf-8',
      // Allows the SW to control the entire origin (not just /api/...)
      'Service-Worker-Allowed': '/',
      // Never cache — always get fresh config from env vars
      'Cache-Control':        'no-store, no-cache, must-revalidate',
    },
  });
}
