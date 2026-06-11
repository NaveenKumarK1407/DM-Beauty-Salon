'use client';
// Brand-colored social buttons — single reusable component for the footer,
// contact page, and anywhere else. All links come from admin Settings:
// Instagram/Facebook URLs are editable fields, WhatsApp uses the studio phone.
import { IconInsta, IconFb, IconWa } from '@/lib/data';
import { useSettings } from '@/lib/settings';

// Shown until the admin fills in their own URLs in Settings
const DEFAULT_INSTAGRAM = 'https://instagram.com/dmbeauty.medak';
const DEFAULT_FACEBOOK = 'https://facebook.com/dmbeauty.medak';

export function Socials({ size = 38 }) {
  const { settings } = useSettings();
  const wa = (settings.phone || '').replace(/[^\d]/g, '');
  const style = { width: size, height: size };
  const items = [
    { cls: 'brand-insta', icon: <IconInsta />, href: settings.instagram || DEFAULT_INSTAGRAM, label: 'Instagram' },
    { cls: 'brand-fb', icon: <IconFb />, href: settings.facebook || DEFAULT_FACEBOOK, label: 'Facebook' },
    { cls: 'brand-wa', icon: <IconWa />, href: wa ? `https://wa.me/${wa}` : null, label: 'WhatsApp' },
  ];
  return (
    <div className="socials" style={{ display: 'flex', gap: 12 }}>
      {items.map((it) =>
        it.href ? (
          <a key={it.label} className={`social-btn ${it.cls}`} style={style} href={it.href} target="_blank" rel="noopener noreferrer" aria-label={it.label}>
            {it.icon}
          </a>
        ) : (
          <span key={it.label} className={`social-btn ${it.cls}`} style={style}>{it.icon}</span>
        )
      )}
    </div>
  );
}
