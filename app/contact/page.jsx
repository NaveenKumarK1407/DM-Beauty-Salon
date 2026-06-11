import { ContactView } from '@/components/ContactView';
import { getStudioSettings } from '@/lib/store';
import { getCityFromAddress } from '@/lib/utils';

export async function generateMetadata() {
  const settings = await getStudioSettings();
  const address = settings?.address || '2nd Floor, Above Pochamma Maidan, Medak 502110';
  const phone = settings?.phone || '+91 98765 43210';
  const city = getCityFromAddress(address);

  return {
    title: 'Contact & Visit',
    description: `Visit DM Beauty Parlour in ${city}, Telangana. Call ${phone}, WhatsApp us, or send an enquiry for bridal consultations.`,
    alternates: { canonical: '/contact' },
  };
}

export default function ContactPage() {
  return <ContactView />;
}
