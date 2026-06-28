export default function manifest() {
  return {
    name: 'DM Beauty Parlour',
    short_name: 'DM Beauty',
    description: 'Bridal & beauty studio in Medak, Telangana.',
    start_url: '/',
    display: 'standalone',
    background_color: '#181410',
    theme_color: '#181410',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
