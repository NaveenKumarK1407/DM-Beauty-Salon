// Firebase Admin SDK — server only.
// Used by API route handlers to persist bookings/messages in Firestore and to
// send Cloud Messaging (FCM) push notifications to the studio.
//
// Gracefully degrades: if the service-account env vars are not set, `isConfigured`
// is false and callers fall back to a local JSON store + console logging, so the
// app runs end-to-end in development without any Firebase credentials.

import 'server-only';

let _app = null;
let _configured = null;

function readServiceAccount() {
  // Option A: full JSON blob in FIREBASE_SERVICE_ACCOUNT_KEY
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // maybe base64-encoded
      try {
        return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
      } catch {
        return null;
      }
    }
  }
  // Option B: discrete vars
  let projectId = process.env.FIREBASE_PROJECT_ID;
  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (projectId && clientEmail && privateKey) {
    // Strip leading/trailing quotes and whitespace (handles double quotes in env file)
    projectId = projectId.trim().replace(/^["']|["']$/g, '');
    clientEmail = clientEmail.trim().replace(/^["']|["']$/g, '');
    privateKey = privateKey.trim().replace(/^["']|["']$/g, '');

    return {
      projectId,
      clientEmail,
      // env files escape newlines — restore them
      privateKey: privateKey.replace(/\\n/g, '\n'),
    };
  }
  return null;
}

export function isConfigured() {
  if (_configured !== null) return _configured;
  _configured = !!readServiceAccount();
  return _configured;
}

async function getApp() {
  if (_app) return _app;
  if (!isConfigured()) return null;

  const { getApps, initializeApp, cert } = await import('firebase-admin/app');
  const existing = getApps();
  if (existing.length) {
    _app = existing[0];
    return _app;
  }
  const sa = readServiceAccount();
  _app = initializeApp({
    credential: cert({
      projectId: sa.projectId || sa.project_id,
      clientEmail: sa.clientEmail || sa.client_email,
      privateKey: sa.privateKey || sa.private_key,
    }),
  });
  return _app;
}

export async function getDb() {
  const app = await getApp();
  if (!app) return null;
  const { getFirestore } = await import('firebase-admin/firestore');
  return getFirestore(app);
}

export async function getMessaging() {
  const app = await getApp();
  if (!app) return null;
  const { getMessaging } = await import('firebase-admin/messaging');
  return getMessaging(app);
}

// Topic that the studio's device(s) subscribe to for booking/contact alerts.
export const ADMIN_TOPIC = 'admin-alerts';
