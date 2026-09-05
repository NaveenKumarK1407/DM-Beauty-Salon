// Single source of truth for the production origin.
//
// Every canonical tag, sitemap entry, robots directive and schema @id is built
// from this value. It was previously duplicated as a literal in four files,
// which is how a stale domain silently ends up in half the rendered URLs.
//
// In production NEXT_PUBLIC_SITE_URL must be set (Vercel → Settings →
// Environment Variables). The fallback exists only so local dev and CI builds
// resolve to something sane — never rely on it for a deploy.

const FALLBACK_ORIGIN = 'https://dmbeautysalon.in';

/** Strip any trailing slash so `${SITE_URL}${path}` never yields a double slash. */
function normalizeOrigin(value) {
  const raw = (value || '').trim();
  if (!raw) return FALLBACK_ORIGIN;
  return raw.replace(/\/+$/, '');
}

export const SITE_URL = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL);

/** Absolute URL for a site-relative path, e.g. absoluteUrl('/services'). */
export function absoluteUrl(path = '') {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Default contact address, kept on the real domain. */
export const DEFAULT_EMAIL = 'hello@dmbeautysalon.in';
