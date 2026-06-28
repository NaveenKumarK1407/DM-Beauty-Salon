const ICONS = [
  { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
  { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
  { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
];

export function getPublicManifest() {
  return {
    name: 'DM Beauty Parlour',
    short_name: 'DM Beauty',
    description: 'Bridal & beauty studio in Medak, Telangana.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#181410',
    theme_color: '#181410',
    icons: ICONS,
  };
}

export function getAdminManifest() {
  return {
    name: 'DM Beauty Admin',
    short_name: 'DM Admin',
    description: 'Studio dashboard — bookings, customers, walk-ins and settings.',
    start_url: '/admin',
    scope: '/admin',
    display: 'standalone',
    background_color: '#181410',
    theme_color: '#181410',
    icons: ICONS,
  };
}
