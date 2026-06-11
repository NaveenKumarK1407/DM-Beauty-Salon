import { Suspense } from 'react';
import { BookingFlow } from '@/components/BookingFlow';
import { getStudioSettings } from '@/lib/store';
import { getCityFromAddress } from '@/lib/utils';

export async function generateMetadata() {
  const settings = await getStudioSettings();
  const address = settings?.address || '2nd Floor, Above Pochamma Maidan, Medak 502110';
  const city = getCityFromAddress(address);

  return {
    title: 'Book an Appointment',
    description: `Reserve a chair at DM Beauty Parlour, ${city}. Choose your service, pick a date and time, and confirm in under a minute.`,
    alternates: { canonical: '/booking' },
    robots: { index: false, follow: true },
  };
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div className="booking-shell" />}>
      <BookingFlow />
    </Suspense>
  );
}
