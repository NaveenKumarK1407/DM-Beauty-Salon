import { GalleryView } from '@/components/GalleryView';
import { getStudioSettings, listGallery } from '@/lib/store';
import { getCityFromAddress } from '@/lib/utils';

export async function generateMetadata() {
  const settings = await getStudioSettings();
  const address = settings?.address || '2nd Floor, Above Pochamma Maidan, Medak 502110';
  const city = getCityFromAddress(address);

  return {
    title: 'Gallery & Lookbook',
    description: `Recent brides, gel nail sets, hair colour edits and skin transformations from DM Beauty Parlour, ${city}.`,
    alternates: { canonical: '/gallery' },
  };
}

export default async function GalleryPage() {
  const gallery = await listGallery();
  return <GalleryView initialGallery={gallery} />;
}
