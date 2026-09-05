import './globals.css';
import { SiteChrome } from '@/components/Chrome';
import { getStudioSettings } from '@/lib/store';
import { getCityFromAddress } from '@/lib/utils';
import { MEDAK_GEO, MEDAK_AREAS } from '@/lib/localSeo';

import { SITE_URL, DEFAULT_EMAIL } from '@/lib/siteUrl';

export async function generateMetadata() {
  const settingsMeta = await getStudioSettings();
  const settings = settingsMeta || {};
  const address = settings.address || '2nd Floor, Above Pochamma Maidan, Medak 502110';
  const city = getCityFromAddress(address);

  return {
    metadataBase: new URL(SITE_URL),
    // Title leads with the exact phrase people type ("beauty parlour in Medak")
    // and keeps the brand at the end, where it still reads naturally in the SERP.
    title: {
      default: `Beauty Salon in ${city} | DM Beauty Parlour`,
      template: `%s · DM Beauty Parlour ${city}`,
      // absolute-title pages (the local landing page) opt out of the template
      // above so the brand is not appended twice.
    },
    description:
      `Looking for a beauty parlour in ${city}? DM Beauty Parlour is a ladies beauty salon and bridal makeup studio in ${city}, Telangana 502110 — HD & airbrush bridal makeup, hair colour, facials, gel nails, waxing and threading. Walk-ins welcome. Call or book online.`,
    keywords: [
      `beauty parlour in ${city}`,
      `best beauty parlour in ${city}`,
      `beauty parlour ${city}`,
      `ladies beauty parlour ${city}`,
      `beauty salon in ${city}`,
      `bridal makeup in ${city}`,
      `bridal makeup artist in ${city}`,
      `makeup artist ${city}`,
      `hair salon ${city}`,
      `facial in ${city}`,
      `nail art ${city}`,
      `waxing and threading ${city}`,
      `beauty parlour near me ${city}`,
      `${city} Telangana 502110`,
      'HD makeup',
      'DM Beauty Parlour',
    ],
    authors: [{ name: 'DM Beauty Parlour' }],
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: SITE_URL,
      siteName: 'DM Beauty Parlour',
      title: `DM Beauty Parlour — Bridal & Beauty Studio in ${city}`,
      description:
        `Everyday beauty rituals and once-in-a-lifetime bridal looks, crafted by Devi Madhuri in ${city}, Telangana.`,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=85',
          width: 1200,
          height: 630,
          alt: 'Beauty and makeup inspiration',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `DM Beauty Parlour — Bridal & Beauty Studio in ${city}`,
      description: `Everyday beauty rituals and once-in-a-lifetime bridal looks in ${city}, Telangana.`,
    },
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
      shortcut: ['/icon-192.png'],
    },
  };
}

export const viewport = {
  themeColor: '#181410',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  const settingsRaw = await getStudioSettings();
  const settings = settingsRaw || {};
  const address = settings.address || '2nd Floor, Above Pochamma Maidan, Medak 502110';
  const phone = settings.phone || '+91 98765 43210';
  const email = settings.email || DEFAULT_EMAIL;
  const city = getCityFromAddress(address);

  // Parse address for JSON-LD schema
  const addressParts = address.split(',').map((p) => p.trim());
  const streetAddress = addressParts.slice(0, Math.max(1, addressParts.length - 2)).join(', ');
  let postalCode = '502110';
  const pinCodeMatch = address.match(/\b\d{5,6}\b/);
  if (pinCodeMatch) {
    postalCode = pinCodeMatch[0];
  }

  const socialProfiles = [settings.instagram, settings.facebook, settings.googleMapsUrl]
    .filter((u) => typeof u === 'string' && /^https?:\/\//.test(u.trim()))
    .map((u) => u.trim());

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    name: settings.name || 'DM Beauty Parlour',
    description:
      'Beauty studio for everyday rituals and bridal looks — makeup, hair, skin, nails, waxing and threading.',
    url: SITE_URL,
    telephone: phone,
    email: email,
    priceRange: '₹₹',
    image: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&q=85',
    address: {
      '@type': 'PostalAddress',
      streetAddress: streetAddress || address,
      addressLocality: city,
      addressRegion: 'Telangana',
      postalCode: postalCode,
      addressCountry: 'IN',
    },
    geo: { '@type': 'GeoCoordinates', latitude: MEDAK_GEO.lat, longitude: MEDAK_GEO.lng },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    // Towns Google should associate the business with for "near me" searches.
    areaServed: MEDAK_AREAS.map((a) => ({ '@type': 'Place', name: a })),
    knowsLanguage: ['te', 'hi', 'en'],
    // sameAs is one of the strongest entity signals for the map pack — it links
    // this site to the profiles Google already trusts. Only real, live profiles
    // are emitted; an empty setting is dropped rather than shipped as a dead URL.
    ...(socialProfiles.length ? { sameAs: socialProfiles } : {}),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '10:00',
        closes: '20:00',
      },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '09:00', closes: '21:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Sunday', opens: '10:00', closes: '18:00' },
    ],
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Jost:wght@300;400;500;600&family=Italiana&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&family=DM+Serif+Display&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/icon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <SiteChrome initialSettings={settings}>{children}</SiteChrome>
      </body>
    </html>
  );
}
