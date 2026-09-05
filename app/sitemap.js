import { SITE_URL } from '@/lib/siteUrl';

// Public discovery routes. Priority is a sitemap hint, not a ranking signal.
const ROUTES = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/beauty-parlour-in-medak', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/services', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/gallery', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/booking', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.7, changeFrequency: 'monthly' },
];

export default function sitemap() {
  return ROUTES.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
