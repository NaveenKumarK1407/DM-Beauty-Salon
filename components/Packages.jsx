'use client';
// Packages section — shared by Home and Services.
import React from 'react';
import Link from 'next/link';
import { cachedFetchJson } from '@/lib/clientCache';

export function Packages({ initialPackages = null }) {
  const [packages, setPackages] = React.useState(initialPackages ?? []);

  React.useEffect(() => {
    if (initialPackages !== null) return;
    cachedFetchJson('/api/packages')
      .then((data) => {
        if (data.packages) setPackages(data.packages);
      })
      .catch((err) => console.error('Failed to fetch packages:', err));
  }, [initialPackages]);

  const scrollPkgs = [...packages, ...packages, ...packages, ...packages];
  return (
    <section className="section pkg-section" style={{ overflow: 'hidden' }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Packages</span>
          <h2>Bundled with intention, priced to come back.</h2>
        </div>
      </div>
      <div className="card-marquee">
        <div className="card-track">
          {scrollPkgs.map((p, idx) => (
            <Link key={`${p.id}-${idx}`} href="/booking" className="svc-card" style={{ display: 'block' }}>
              <div className="img"><img src={p.img} alt={p.name} loading="lazy" decoding="async" /></div>
              <div style={{ padding: '4px 4px 8px 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span className="eyebrow" style={{ fontSize: 10 }}>{p.tag}</span>
                </div>
                <h3 style={{ fontSize: 18, marginBottom: 8 }}>{p.name}</h3>
                <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 12, lineHeight: 1.4 }}>{p.desc}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: 'var(--ink-2)' }}>
                  {(p.includes || []).map((it, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ width: 12, color: 'var(--gold)', fontSize: 10 }}>✦</span>{it}
                    </li>
                  ))}
                </ul>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


