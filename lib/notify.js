// Push notifications — admin devices + customer devices (by phone).
// No-ops gracefully when Firebase isn't configured.

import 'server-only';
import { getMessaging, isConfigured } from './firebaseAdmin.js';
import { listAdminTokens, listCustomerTokens } from './store.js';
import { normalizePhoneDigits } from './utils.js';

async function sendMulticast(tokens, { title, body, data = {}, link = '/admin' }) {
  if (!tokens.length) return { sent: 0, configured: true };

  const messaging = await getMessaging();
  if (!messaging) return { sent: 0, configured: true };

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
        fcmOptions: { link },
      },
    });
    return { sent: res.successCount, failed: res.failureCount, configured: true };
  } catch (err) {
    console.error('[notify] FCM send failed:', err?.message || err);
    return { sent: 0, error: true, configured: true };
  }
}

/** Push to admin/studio devices (registered from /admin bell icon). */
export async function notifyStudio({ title, body, data = {} }) {
  if (!isConfigured()) {
    console.log('[notify:admin] (Firebase not configured) ->', title, '·', body);
    return { sent: 0, configured: false };
  }

  const tokens = await listAdminTokens();
  if (tokens.length === 0) {
    console.log('[notify:admin] no devices ->', title);
    return { sent: 0, configured: true };
  }

  return sendMulticast(tokens, { title, body, data, link: '/admin' });
}

/** Push to customer devices that opted in with this phone number. */
export async function notifyCustomer({ phone, title, body, data = {}, link = '/booking' }) {
  if (!isConfigured()) {
    console.log('[notify:customer] (Firebase not configured) ->', title, '·', body);
    return { sent: 0, configured: false };
  }

  const digits = normalizePhoneDigits(phone);
  if (digits.length !== 10) {
    return { sent: 0, configured: true, reason: 'invalid_phone' };
  }

  const tokens = await listCustomerTokens(digits);
  if (tokens.length === 0) {
    console.log('[notify:customer] no devices for', digits, '->', title);
    return { sent: 0, configured: true, reason: 'no_tokens' };
  }

  return sendMulticast(tokens, { title, body, data, link });
}
