// Local SEO landing page targeting "beauty parlour in Medak" and its variants.
// Server-rendered so the copy, FAQ and LocalBusiness schema are in the initial
// HTML — Google's crawler indexes it without running JS.
import Link from 'next/link';
import { getStudioSettings, listServices } from '@/lib/store';
import { getCityFromAddress } from '@/lib/utils';
import { formatHoursDisplay } from '@/lib/hours';
import { LocalSeoBody } from '@/components/LocalSeoView';
import { MEDAK_FAQS, MEDAK_AREAS, MEDAK_GEO } from '@/lib/localSeo';
import { SITE_URL, DEFAULT_EMAIL } from '@/lib/siteUrl';

const PATH = '/beauty-parlour-in-medak';

export async function generateMetadata() {
  const settings = await getStudioSettings();
  const address = settings?.address || '2nd Floor, Above Pochamma Maidan, Medak 502110';
  const city = getCityFromAddress(address);

  // Kept near 60 characters so Google shows it whole, with the exact target
  // phrase first. `absolute` opts out of the layout's brand-suffix template,
  // which would otherwise push the title past the truncation point.
  const title = `Beauty Parlour in ${city} | DM Beauty Parlour`;
  const description =
    `DM Beauty Parlour is a ladies beauty parlour in ${city}, Telangana 502110 — bridal makeup, HD & airbrush makeup, hair colour, facials, gel nails, waxing and threading. Walk-ins welcome. Book on WhatsApp.`;

  return {
    title: { absolute: title },
    description,
    keywords: [
      `beauty parlour in ${city}`,
      `beauty parlour ${city}`,
      `best beauty parlour in ${city}`,
      `ladies beauty parlour ${city}`,
      `bridal makeup in ${city}`,
      `bridal makeup artist ${city}`,
      `beauty salon ${city}`,
      `makeup artist in ${city}`,
      `hair salon ${city}`,
      `facial in ${city}`,
      `nail art ${city}`,
      `waxing and threading ${city}`,
      `${city} Telangana 502110 beauty parlour`,
      `beauty parlour near me ${city}`,
    ],
    alternates: { canonical: PATH },
    openGraph: {
      type: 'website',
      locale: 'en_IN',
      url: `${SITE_URL}${PATH}`,
      siteName: 'DM Beauty Parlour',
      title,
      description,
    },
    twitter: { card: 'summary_large_image', title, description },
    robots: { index: true, follow: true },
  };
}

export default async function BeautyParlourInMedakPage() {
  const [settingsRaw, services] = await Promise.all([getStudioSettings(), listServices()]);
  const settings = settingsRaw || {};
  const address = settings.address || '2nd Floor, Above Pochamma Maidan, Medak 502110';
  const phone = settings.phone || '+91 98765 43210';
  const email = settings.email || DEFAULT_EMAIL;
  const city = getCityFromAddress(address);
  const hours = formatHoursDisplay(settings);
  const name = settings.name || 'DM Beauty Parlour';

  const postalCode = (address.match(/\b\d{6}\b/) || ['502110'])[0];
  const addressParts = address.split(',').map((p) => p.trim());
  const streetAddress =
    addressParts.slice(0, Math.max(1, addressParts.length - 1)).join(', ') || address;

  // Two graphs: the salon itself (with the service catalogue Google reads for
  // rich results) and the FAQ block that can win an expandable SERP entry.
  const businessLd = {
    '@context': 'https://schema.org',
    '@type': 'BeautySalon',
    '@id': `${SITE_URL}${PATH}#business`,
    name,
    alternateName: [`${name} ${city}`, `Beauty Parlour in ${city}`],
    description: `Ladies beauty parlour and bridal makeup studio in ${city}, Telangana — makeup, hair, skin, nails, waxing and threading.`,
    url: `${SITE_URL}${PATH}`,
    telephone: phone,
    email,
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    address: {
      '@type': 'PostalAddress',
      streetAddress,
      addressLocality: city,
      addressRegion: 'Telangana',
      postalCode,
      addressCountry: 'IN',
    },
    geo: { '@type': 'GeoCoordinates', latitude: MEDAK_GEO.lat, longitude: MEDAK_GEO.lng },
    hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    areaServed: MEDAK_AREAS.map((a) => ({ '@type': 'Place', name: a })),
    knowsLanguage: ['te', 'hi', 'en'],
    // Prices are optional in the admin panel, so an Offer only carries price
    // fields when a real number exists — emitting "null" or a 0 here is invalid
    // structured data and gets the whole block rejected.
    makesOffer: services.slice(0, 12).map((s) => {
      const price = Number(s.price);
      const hasPrice = Number.isFinite(price) && price > 0;
      return {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: s.name,
          ...(s.desc ? { description: s.desc } : {}),
          ...(s.cat ? { category: s.cat } : {}),
        },
        ...(hasPrice ? { price: String(price), priceCurrency: 'INR' } : {}),
        availableAtOrFrom: { '@id': `${SITE_URL}${PATH}#business` },
      };
    }),
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: MEDAK_FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a({ city, phone, address, hours }) },
    })),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: `Beauty Parlour in ${city}`, item: `${SITE_URL}${PATH}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(businessLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <LocalSeoBody
        city={city}
        name={name}
        address={address}
        phone={phone}
        email={email}
        hours={hours}
        services={services}
      />
    </>
  );
}
