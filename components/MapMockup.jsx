// Real Google Maps embed (keyless). Fills its container — wrap in .map for
// the aspect-ratio, radius and overflow clipping.
export function MapEmbed({ address = 'Medak Telangana', title = 'DM Beauty location map' }) {
  return (
    <iframe
      src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
      title={title}
      style={{ border: 0, display: 'block', width: '100%', height: '100%' }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}

// Decorative map illustration (pure SVG, no interactivity).
export function MapMockup({ city = 'MEDAK' }) {
  return (
    <svg viewBox="0 0 600 320" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }}>
      <defs>
        <pattern id="gridP" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(140,106,68,0.07)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="600" height="320" fill="var(--bg-cream)" />
      <rect width="600" height="320" fill="url(#gridP)" />
      <path d="M -20 80 Q 200 60 380 110 T 620 130" stroke="#fff" strokeWidth="14" fill="none" opacity="0.85" />
      <path d="M -20 80 Q 200 60 380 110 T 620 130" stroke="rgba(140,106,68,0.3)" strokeWidth="14" fill="none" strokeDasharray="2 6" />
      <path d="M 100 -20 Q 140 150 220 340" stroke="#fff" strokeWidth="10" fill="none" opacity="0.85" />
      <path d="M 450 -20 Q 420 180 500 340" stroke="#fff" strokeWidth="8" fill="none" opacity="0.85" />
      <path d="M -20 240 Q 200 220 400 250 T 620 260" stroke="#fff" strokeWidth="8" fill="none" opacity="0.85" />
      <rect x="40" y="120" width="120" height="80" fill="rgba(255,255,255,0.4)" rx="4" />
      <rect x="260" y="160" width="80" height="60" fill="rgba(255,255,255,0.4)" rx="4" />
      <rect x="500" y="180" width="80" height="100" fill="rgba(255,255,255,0.4)" rx="4" />
      <g transform="translate(310, 130)">
        <circle r="28" fill="rgba(181,142,99,0.18)" />
        <circle r="16" fill="rgba(181,142,99,0.35)" />
        <path d="M 0 -12 C -7 -12 -12 -7 -12 0 C -12 8 0 18 0 18 C 0 18 12 8 12 0 C 12 -7 7 -12 0 -12 Z" fill="var(--gold-deep)" />
        <circle cx="0" cy="0" r="4" fill="#fff" />
      </g>
      <text x="350" y="135" fontFamily="var(--font-display)" fontSize="18" fill="var(--ink)">DM Beauty</text>
      <text x="350" y="156" fontFamily="var(--font-body)" fontSize="11" fill="var(--muted)" letterSpacing="1.5">PARLOUR · {city.toUpperCase()}</text>
    </svg>
  );
}
