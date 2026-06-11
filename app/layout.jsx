import './globals.css';
import { SiteChrome } from '@/components/Chrome';
import { getStudioSettings } from '@/lib/store';
import { getCityFromAddress } from '@/lib/utils';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dmbeauty.in';

export async function generateMetadata() {
  const settings = await getStudioSettings();
  const address = settings?.address || '2nd Floor, Above Pochamma Maidan, Medak 502110';
  const city = getCityFromAddress(address);

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: `DM Beauty Parlour — Bridal & Beauty Studio in ${city}, Telangana`,
      template: `%s · DM Beauty Parlour`,
    },
    description:
      `A small, considered beauty studio for everyday rituals and once-in-a-lifetime bridal looks. Bridal makeup, hair, skin, nails and more in ${city}, Telangana.`,
    keywords: [
      `beauty parlour ${city}`,
      `bridal makeup ${city}`,
      'beauty studio Telangana',
      'HD makeup',
      'hair colour',
      'facial',
      'nail art',
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
          alt: 'DM Beauty Parlour studio',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `DM Beauty Parlour — Bridal & Beauty Studio in ${city}`,
      description: `Everyday beauty rituals and once-in-a-lifetime bridal looks in ${city}, Telangana.`,
    },
    robots: { index: true, follow: true },
  };
}

export const viewport = {
  themeColor: '#1a1a1a',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }) {
  const settings = await getStudioSettings();
  const address = settings?.address || '2nd Floor, Above Pochamma Maidan, Medak 502110';
  const phone = settings?.phone || '+91 98765 43210';
  const email = settings?.email || 'hello@dmbeauty.in';
  const city = getCityFromAddress(address);

  // Parse address for JSON-LD schema
  const addressParts = address.split(',').map((p) => p.trim());
  const streetAddress = addressParts.slice(0, Math.max(1, addressParts.length - 2)).join(', ');
  let postalCode = '502110';
  const pinCodeMatch = address.match(/\b\d{5,6}\b/);
  if (pinCodeMatch) {
    postalCode = pinCodeMatch[0];
  }

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
    geo: { '@type': 'GeoCoordinates', latitude: 18.0461, longitude: 78.2693 },
    aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', reviewCount: '312' },
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
