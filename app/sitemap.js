const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dmbeauty.in';

// Priority reflects ranking intent, not page importance to us: the home page and
// the Medak local landing page are the two URLs we want Google to treat as the
// entry points for "beauty parlour in Medak" style searches.
const ROUTES = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/beauty-parlour-in-medak', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/services', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/gallery', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/booking', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
];

export default function sitemap() {
  const now = new Date();
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
