// Sends Firebase Cloud Messaging push notifications to the studio's devices.
// No-ops gracefully (logs to console) when Firebase isn't configured.

import 'server-only';
import { getMessaging, isConfigured } from './firebaseAdmin.js';
import { listTokens } from './store.js';

export async function notifyStudio({ title, body, data = {} }) {
  if (!isConfigured()) {
    console.log('[notify] (Firebase not configured) ->', title, '·', body);
    return { sent: 0, configured: false };
  }

  const messaging = await getMessaging();
  const tokens = await listTokens();
  if (!messaging || tokens.length === 0) {
    console.log('[notify] no registered devices for:', title);
    return { sent: 0, configured: true };
  }

  // stringify data values — FCM data payloads must be strings
  const stringData = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  );

  try {
    const res = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: stringData,
      webpush: {
        notification: { title, body, icon: '/dm_logo.png', badge: '/dm_logo.png' },
        fcmOptions: { link: '/admin' },
      },
    });
    return { sent: res.successCount, failed: res.failureCount, configured: true };
  } catch (err) {
    console.error('[notify] FCM send failed:', err?.message || err);
    return { sent: 0, error: true, configured: true };
  }
}
