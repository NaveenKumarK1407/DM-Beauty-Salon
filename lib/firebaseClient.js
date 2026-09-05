'use client';
// Client-side Firebase SDK.
// Exposes helpers for Auth (Google sign-in), Firestore (real-time listeners)
// and Cloud Messaging (push notification opt-in).

import { initializeApp, getApps } from 'firebase/app';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

export const isClientConfigured = () =>
  !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.messagingSenderId);

function getClientApp() {
  if (!isClientConfigured()) return null;
  return getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
}

// ── Auth helper ──────────────────────────────────────────────
export async function getClientAuth() {
  const app = getClientApp();
  if (!app) return null;
  const { getAuth } = await import('firebase/auth');
  return getAuth(app);
}

// ── Firestore client helper (for real-time onSnapshot) ───────
export async function getClientDb() {
  const app = getClientApp();
  if (!app) return null;
  const { getFirestore } = await import('firebase/firestore');
  return getFirestore(app);
}

// Request permission, get an FCM token, and register with the backend.
async function registerPushToken({ role = 'admin', phone = null } = {}) {
  if (typeof window === 'undefined') return { ok: false, reason: 'no-window' };
  if (!isClientConfigured()) return { ok: false, reason: 'not-configured' };
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    return { ok: false, reason: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return { ok: false, reason: 'denied' };

    const { getMessaging, getToken, isSupported, onMessage } = await import('firebase/messaging');
    if (!(await isSupported())) return { ok: false, reason: 'unsupported' };

    const registration = await navigator.serviceWorker.register(
      '/api/firebase-messaging-sw',
      { scope: '/' }
    );
    const messaging = getMessaging(getClientApp());

    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    if (!token) return { ok: false, reason: 'no-token' };

    onMessage(messaging, (payload) => {
      const n = payload.notification || {};
      if (Notification.permission === 'granted') {
        new Notification(n.title || 'DM Beauty', { body: n.body, icon: '/dm_logo.png' });
      }
    });

    const body = { token, agent: navigator.userAgent, role };
    if (role === 'customer' && phone) body.phone = phone;

    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    return { ok: true, token };
  } catch (err) {
    console.error('registerPushToken failed:', err);
    return { ok: false, reason: 'error' };
  }
}

/** Admin — enable push on /admin (bell icon). */
export async function enableStudioNotifications() {
  return registerPushToken({ role: 'admin' });
}

/** Customer — opt in on booking confirmation for appointment reminders. */
export async function enableCustomerReminders(phone) {
  return registerPushToken({ role: 'customer', phone });
}
