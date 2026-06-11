const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dmbeauty.in';

export default function sitemap() {
  const now = new Date();
  const routes = ['', '/services', '/gallery', '/contact', '/booking'];
  return routes.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.8,
  }));
}
