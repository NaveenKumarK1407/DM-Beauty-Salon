'use client';
// Floating WhatsApp chat button — visible on all public pages (not admin/design).
import { IconWa } from '@/lib/data';
import { useSettings } from '@/lib/settings';
import { getWhatsAppHref } from '@/lib/whatsapp';

const DEFAULT_MESSAGE =
  'Hi! I would like to book an appointment at DM Beauty Parlour.';

export function WhatsAppFab() {
  const { settings } = useSettings();
  const href = getWhatsAppHref(
    settings?.phone,
    DEFAULT_MESSAGE.replace('DM Beauty Parlour', settings?.name || 'DM Beauty Parlour')
  );

  if (!href) return null;

  return (
    <a
      href={href}
      className="wa-fab"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      title="Chat on WhatsApp"
    >
      <IconWa />
    </a>
  );
}
