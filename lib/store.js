// Storage abstraction for bookings, contact messages and FCM tokens.
// Uses Firestore when Firebase Admin is configured; otherwise falls back to a
// local JSON file under .data/ so the backend works without any credentials.

import 'server-only';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { getDb, isConfigured } from './firebaseAdmin.js';
import { STATIC_SERVICES, STATIC_GALLERY, STATIC_PACKAGES } from './staticData';

const DATA_DIR = path.join(process.cwd(), '.data');

// In-memory micro-cache for the hot public reads (settings, services, gallery,
// packages). Every page render + API route was a Firestore round-trip; these
// change rarely, so serve from memory and bust on writes.
const CACHE_TTL = 60 * 1000;
// Pinned to globalThis: each API route can get its own copy of this module,
// and a write must bust the same cache the read routes serve from.
const readCache = globalThis.__dmReadCache || (globalThis.__dmReadCache = new Map()); // key -> { t, data }

async function cached(key, loader) {
  const hit = readCache.get(key);
  if (hit && Date.now() - hit.t < CACHE_TTL) return hit.data;
  const data = await loader();
  readCache.set(key, { t: Date.now(), data });
  return data;
}

const bust = (key) => readCache.delete(key);

// Catalogs display oldest-first so new items append at the end and the
// category filter order stays stable. (list() returns newest-first, which
// is right for bookings/messages but wrong for catalogs.)
const byCreatedAsc = (rows) =>
  [...rows].sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));

async function readLocal(name) {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${name}.json`), 'utf8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeLocal(name, rows) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, `${name}.json`), JSON.stringify(rows, null, 2), 'utf8');
}

function id() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Generic add/list ──────────────────────────────────────
async function add(collection, doc) {
  const record = { id: id(), createdAt: new Date().toISOString(), ...doc };
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection(collection).doc(record.id).set(record);
      return record;
    }
  }
  const rows = await readLocal(collection);
  rows.unshift(record);
  await writeLocal(collection, rows);
  return record;
}

async function list(collection, max = 100) {
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      const snap = await db.collection(collection).orderBy('createdAt', 'desc').limit(max).get();
      return snap.docs.map((d) => d.data());
    }
  }
  const rows = await readLocal(collection);
  return rows.slice(0, max);
}

// ── Public API ────────────────────────────────────────────
export const saveBooking = (b) => add('bookings', b);
export const listBookings = (max) => list('bookings', max);

export const saveMessage = (m) => add('messages', m);
export const listMessages = (max) => list('messages', max);

export async function updateMessage(id, patch) {
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('messages').doc(id).set(patch, { merge: true });
      return true;
    }
  }
  let rows = await readLocal('messages');
  rows = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
  await writeLocal('messages', rows);
  return true;
}

export async function deleteMessage(id) {
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('messages').doc(id).delete();
      return true;
    }
  }
  let rows = await readLocal('messages');
  rows = rows.filter((r) => r.id !== id);
  await writeLocal('messages', rows);
  return true;
}

export async function saveToken(token, meta = {}) {
  if (!token) return null;
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('fcmTokens').doc(token).set(
        { token, ...meta, updatedAt: new Date().toISOString() },
        { merge: true }
      );
      return { token };
    }
  }
  const rows = await readLocal('fcmTokens');
  if (!rows.find((r) => r.token === token)) {
    rows.push({ token, ...meta, updatedAt: new Date().toISOString() });
    await writeLocal('fcmTokens', rows);
  }
  return { token };
}

export async function listTokens() {
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      const snap = await db.collection('fcmTokens').get();
      return snap.docs.map((d) => d.data().token).filter(Boolean);
    }
  }
  const rows = await readLocal('fcmTokens');
  return rows.map((r) => r.token).filter(Boolean);
}

// ── Services Catalog ──────────────────────────────────────
export const saveService = async (s) => {
  const r = await add('services', s);
  bust('services');
  return r;
};

export function listServices() {
  return cached('services', async () => {
    const dbList = await list('services', 100);
    if (dbList.length > 0) return byCreatedAsc(dbList);

    // Return static fallback if Firestore/local has no entries
    return STATIC_SERVICES;
  });
}

export async function deleteService(id) {
  bust('services');
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('services').doc(id).delete();
      return true;
    }
  }
  let rows = await readLocal('services');
  rows = rows.filter((r) => r.id !== id);
  await writeLocal('services', rows);
  return true;
}

export async function updateService(id, patch) {
  bust('services');
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('services').doc(id).set(patch, { merge: true });
      return true;
    }
  }
  let rows = await readLocal('services');
  rows = rows.map((r) => r.id === id ? { ...r, ...patch } : r);
  await writeLocal('services', rows);
  return true;
}

// ── Gallery Lookbook ──────────────────────────────────────
export const saveGalleryItem = async (g) => {
  const r = await add('gallery', g);
  bust('gallery');
  return r;
};

export function listGallery() {
  // no static fallback — start empty until real photos are uploaded
  return cached('gallery', async () => byCreatedAsc(await list('gallery', 100)));
}

export async function deleteGalleryItem(id) {
  bust('gallery');
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('gallery').doc(id).delete();
      return true;
    }
  }
  let rows = await readLocal('gallery');
  rows = rows.filter((r) => r.id !== id);
  await writeLocal('gallery', rows);
  return true;
}

// ── Studio Settings ───────────────────────────────────────
export function getStudioSettings() {
  return cached('settings', getStudioSettingsUncached);
}

async function getStudioSettingsUncached() {
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      const doc = await db.collection('settings').doc('studio').get();
      if (doc.exists) {
        return doc.data();
      }
    }
  }
  const rows = await readLocal('settings');
  const found = rows.find((r) => r.id === 'studio');
  if (found) return found;

  return {
    id: 'studio',
    name: 'DM Beauty Parlour',
    phone: '+91 98765 43210',
    email: 'hello@dmbeauty.in',
    currency: 'INR · ₹',
    hoursText: 'Mon – Sat · 10am – 8pm, Sun · Closed',
    openTime: '10:00',
    closeTime: '20:00',
    closedDays: ['Sunday'],
  };
}

export async function saveStudioSettings(settings) {
  bust('settings');
  const data = {
    id: 'studio',
    name: settings.name || 'DM Beauty Parlour',
    phone: settings.phone || '+91 98765 43210',
    email: settings.email || 'hello@dmbeauty.in',
    currency: settings.currency || 'INR · ₹',
    address: settings.address || '2nd Floor, Above Pochamma Maidan, Medak 502110',
    hoursText: settings.hoursText || 'Mon – Sat · 10am – 8pm, Sun · Closed',
    openTime: settings.openTime || '10:00',
    closeTime: settings.closeTime || '20:00',
    closedDays: settings.closedDays || ['Sunday'],
    instagram: settings.instagram || '',
    facebook: settings.facebook || '',
    updatedAt: new Date().toISOString()
  };

  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('settings').doc('studio').set(data);
      return data;
    }
  }
  let rows = await readLocal('settings');
  rows = rows.filter((r) => r.id !== 'studio');
  rows.push(data);
  await writeLocal('settings', rows);
  return data;
}

// ── Packages Catalog ──────────────────────────────────────
export const savePackage = async (p) => {
  const r = await add('packages', p);
  bust('packages');
  return r;
};

export function listPackages() {
  return cached('packages', async () => {
    const dbList = await list('packages', 100);
    if (dbList.length > 0) return byCreatedAsc(dbList);
    return STATIC_PACKAGES;
  });
}

export async function deletePackage(id) {
  bust('packages');
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('packages').doc(id).delete();
      return true;
    }
  }
  let rows = await readLocal('packages');
  rows = rows.filter((r) => r.id !== id);
  await writeLocal('packages', rows);
  return true;
}

export async function updatePackage(id, patch) {
  bust('packages');
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('packages').doc(id).set(patch, { merge: true });
      return true;
    }
  }
  let rows = await readLocal('packages');
  rows = rows.map((r) => r.id === id ? { ...r, ...patch } : r);
  await writeLocal('packages', rows);
  return true;
}

// ── Customer Reviews (shown as website testimonials) ─────
export const saveReview = async (r) => {
  const x = await add('reviews', r);
  bust('reviews');
  return x;
};

export function listReviews() {
  return cached('reviews', async () => byCreatedAsc(await list('reviews', 100)));
}

export async function updateReview(id, patch) {
  bust('reviews');
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('reviews').doc(id).set(patch, { merge: true });
      return true;
    }
  }
  let rows = await readLocal('reviews');
  rows = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
  await writeLocal('reviews', rows);
  return true;
}

export async function deleteReview(id) {
  bust('reviews');
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('reviews').doc(id).delete();
      return true;
    }
  }
  let rows = await readLocal('reviews');
  rows = rows.filter((r) => r.id !== id);
  await writeLocal('reviews', rows);
  return true;
}

// ── Offline Payments ───────────────────────────────────────
export const savePayment = (p) => add('payments', p);
export const listPayments = (max) => list('payments', max);

export async function updatePayment(id, patch) {
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('payments').doc(id).set(patch, { merge: true });
      return true;
    }
  }
  let rows = await readLocal('payments');
  rows = rows.map((r) => (r.id === id ? { ...r, ...patch } : r));
  await writeLocal('payments', rows);
  return true;
}

export async function deletePayment(id) {
  if (isConfigured()) {
    const db = await getDb();
    if (db) {
      await db.collection('payments').doc(id).delete();
      return true;
    }
  }
  let rows = await readLocal('payments');
  rows = rows.filter((r) => r.id !== id);
  await writeLocal('payments', rows);
  return true;
}

