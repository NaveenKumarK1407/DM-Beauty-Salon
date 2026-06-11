import { ServicesView } from '@/components/ServicesView';
import { getStudioSettings, listServices, listPackages } from '@/lib/store';
import { getCityFromAddress } from '@/lib/utils';

export async function generateMetadata() {
  const settings = await getStudioSettings();
  const address = settings?.address || '2nd Floor, Above Pochamma Maidan, Medak 502110';
  const city = getCityFromAddress(address);

  return {
    title: 'Services & Pricing',
    description: `Bridal makeup, party glam, hair colour & spa, facials, gel nails, waxing and threading — honest INR pricing, premium products, in ${city}, Telangana.`,
    alternates: { canonical: '/services' },
  };
}

export default async function ServicesPage() {
  const [services, packages] = await Promise.all([listServices(), listPackages()]);
  return <ServicesView initialServices={services} initialPackages={packages} />;
}
