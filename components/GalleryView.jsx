'use client';
// Gallery — filterable masonry + keyboard-navigable lightbox.
import React from 'react';
import { GALLERY, GALLERY_CATEGORIES, IconInsta } from '@/lib/data';
import { cachedFetchJson } from '@/lib/clientCache';

export function GalleryView({ initialGallery = null }) {
  const [cat, setCat] = React.useState('All');
  const [lightbox, setLightbox] = React.useState(null);
  const [gallery, setGallery] = React.useState(initialGallery ?? []);
  const [loading, setLoading] = React.useState(initialGallery === null);

  React.useEffect(() => {
    if (initialGallery !== null) return;
    cachedFetchJson('/api/gallery')
      .then((j) => {
        if (j.gallery) setGallery(j.gallery);
      })
      .catch((err) => console.error('Failed to load gallery:', err))
      .finally(() => setLoading(false));
  }, [initialGallery]);

  const categories = React.useMemo(() => {
    const cats = new Set(['All']);
    gallery.forEach((g) => {
      if (g.cat) cats.add(g.cat);
    });
    return Array.from(cats);
  }, [gallery]);

  const filtered = cat === 'All' ? gallery : gallery.filter((g) => g.cat === cat);

  const close = () => setLightbox(null);
  const open = (idx) => setLightbox(idx);
  const nav = (dir) => {
    setLightbox((i) => {
      const n = filtered.length;
      return (((i + dir) % n) + n) % n;
    });
  };

  React.useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') nav(1);
      if (e.key === 'ArrowLeft') nav(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="fade-in">
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 0.95; }
          100% { opacity: 0.5; }
        }
      `}</style>
      <section className="section section-soft svc-menu-head">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Lookbook</span>
            <h2>The work that walks out the door.</h2>
            <p>A live feed of our recent brides, gel sets, hair colour edits and skin transformations. Tap any image to view full size.</p>
          </div>
          <div className="chip-row">
            {categories.map((c) => (
              <span key={c} className={'chip ' + (cat === c ? 'active' : '')} onClick={() => setCat(c)}>{c}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="public-svc-scroll">
          <div className={'masonry' + (filtered.length >= 3 ? ' marquee-on' : '')}>
            {loading ? (
              Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="masonry-item" style={{ height: idx % 2 === 0 ? '320px' : '220px', background: '#f5f3ef', borderRadius: '4px', animation: 'shimmer 1.5s infinite ease-in-out', marginBottom: '12px' }} />
              ))
            ) : (
              // Duplicate set completes the mobile auto-scroll loop; hidden on desktop
              (filtered.length >= 3 ? [false, true] : [false]).map((dup) => filtered.map((g, i) => (
                <div key={(dup ? 'dup-' : '') + g.id} aria-hidden={dup || undefined} className={'masonry-item' + (dup ? ' svc-dup' : '')} onClick={() => open(i)}>
                  <img src={g.src} alt={g.title} loading="lazy" />
                  <div className="overlay">
                    <div>
                      <div className="cat-tag">{g.cat}</div>
                      <div className="ttl-tag">{g.title}</div>
                    </div>
                  </div>
                </div>
              )))
            )}
          </div>
          </div>
        </div>
      </section>

      <section className="section section-cream" style={{ padding: '28px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="eyebrow muted">Follow Along</span>
          <h2 style={{ marginTop: 6, marginBottom: 8, fontSize: 'clamp(24px, 2.4vw, 34px)' }}>@dmbeauty.medak</h2>
          <p style={{ color: 'var(--muted)', maxWidth: 480, margin: '0 auto 14px', fontSize: 13 }}>New looks every day on Instagram. DM us a reference and we&apos;ll tell you if it suits your face shape — promise.</p>
          <button className="btn btn-primary" style={{ padding: '10px 18px', fontSize: 11 }}><IconInsta /> &nbsp; Follow on Instagram</button>
        </div>
      </section>

      {lightbox !== null && filtered[lightbox] && (
        <div className="lightbox" onClick={close}>
          {/* Blurred, darkened copy of the photo as the fullscreen backdrop */}
          <div className="lightbox-bg" style={{ backgroundImage: `url(${filtered[lightbox].src})` }} />
          <div className="lightbox-close" onClick={close}>✕</div>
          <div className="lightbox-nav prev" onClick={(e) => { e.stopPropagation(); nav(-1); }}>‹</div>
          <div className="lightbox-nav next" onClick={(e) => { e.stopPropagation(); nav(1); }}>›</div>
          <img src={filtered[lightbox].src.replace('w=700', 'w=1400')} alt={filtered[lightbox].title} onClick={(e) => e.stopPropagation()} />
          <div style={{ position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center', color: '#fff', zIndex: 1 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', opacity: 0.7, textTransform: 'uppercase' }}>{filtered[lightbox].cat}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginTop: 4 }}>{filtered[lightbox].title}</div>
          </div>
        </div>
      )}
    </div>
  );
}
