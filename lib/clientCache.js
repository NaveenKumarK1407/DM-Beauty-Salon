'use client';
// Client-side cache for public API GETs (/api/services, /api/packages, /api/gallery).
// Deduplicates concurrent requests (e.g. two components mounting at once), keeps
// results in memory across client-side navigations, and persists to sessionStorage
// so a full page reload within the TTL also skips the network.
//
// Invalidation works across tabs: a version stamp lives in localStorage (shared
// by all tabs of the site). Any admin write bumps it, so a website tab that's
// still open immediately stops trusting its cached copy — without this, editing
// in an admin tab left other tabs serving stale data for up to the full TTL,
// even across refreshes (sessionStorage survives reloads).

const TTL = 5 * 60 * 1000; // 5 minutes

const memory = new Map(); // url -> { t, v, promise }

function cacheVersion() {
  try {
    return localStorage.getItem('dm-cache-v') || '0';
  } catch {
    return '0';
  }
}

export function cachedFetchJson(url, { ttl = TTL } = {}) {
  const now = Date.now();
  const v = cacheVersion();

  const hit = memory.get(url);
  if (hit && hit.v === v && now - hit.t < ttl) return hit.promise;

  const key = `dm-cache:${url}`;
  try {
    const raw = sessionStorage.getItem(key);
    if (raw) {
      const { t, v: storedV, data } = JSON.parse(raw);
      if (storedV === v && now - t < ttl) {
        const promise = Promise.resolve(data);
        memory.set(url, { t, v, promise });
        return promise;
      }
      sessionStorage.removeItem(key);
    }
  } catch {
    // sessionStorage unavailable (private mode / SSR) — fall through to network
  }

  const promise = fetch(url)
    .then((r) => r.json())
    .then((data) => {
      try {
        sessionStorage.setItem(key, JSON.stringify({ t: now, v, data }));
      } catch {}
      return data;
    })
    .catch((err) => {
      memory.delete(url); // failed fetches shouldn't be cached — allow retry
      throw err;
    });
  memory.set(url, { t: now, v, promise });
  return promise;
}

// Drop a cached entry AND bump the shared version so every other open tab
// refetches too — call after a write (admin saves a service/package/photo).
export function invalidateCached(url) {
  memory.delete(url);
  try {
    sessionStorage.removeItem(`dm-cache:${url}`);
  } catch {}
  try {
    localStorage.setItem('dm-cache-v', String(Date.now()));
  } catch {}
}
