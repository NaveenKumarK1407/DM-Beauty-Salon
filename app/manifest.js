export default function manifest() {
  return {
    name: 'DM Beauty Parlour',
    short_name: 'DM Beauty',
    description: 'Bridal & beauty studio in Medak, Telangana.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf7f2',
    theme_color: '#1a1a1a',
    icons: [
      { src: '/dm_logo.png', sizes: '192x192', type: 'image/png' },
      { src: '/dm_logo.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
