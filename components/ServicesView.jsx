'use client';
// Services page — filterable detailed list. Booking links carry the chosen
// service via the ?service= query param.
import React from 'react';
import Link from 'next/link';
import { Packages } from './Packages';
import { SERVICES, SVC_CATEGORIES, IconArrow, IconClock } from '@/lib/data';
import { cachedFetchJson } from '@/lib/clientCache';

const SkeletonCard = () => (
  <div style={{
    background: '#fff',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid var(--line)',
    display: 'flex',
    flexDirection: 'column',
    height: '380px',
  }}>
    <div className="skeleton-shimmer" style={{ height: '260px', background: '#f5f3ef' }} />
    <div style={{ padding: '20px 0 0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton-shimmer" style={{ width: '60%', height: '20px', background: '#f5f3ef', borderRadius: '4px' }} />
        <div className="skeleton-shimmer" style={{ width: '20%', height: '20px', background: '#f5f3ef', borderRadius: '4px' }} />
      </div>
      <div className="skeleton-shimmer" style={{ width: '100%', height: '14px', background: '#f5f3ef', borderRadius: '4px', marginTop: '8px' }} />
      <div className="skeleton-shimmer" style={{ width: '80%', height: '14px', background: '#f5f3ef', borderRadius: '4px' }} />
    </div>
  </div>
);

export function ServicesView() {
  const [cat, setCat] = React.useState('All');
  const [services, setServices] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    cachedFetchJson('/api/services')
      .then((j) => {
        if (j.services) setServices(j.services);
      })
      .catch((err) => console.error('Failed to load services:', err))
      .finally(() => setLoading(false));
  }, []);

  const publicServices = React.useMemo(() => {
    return services;
  }, [services]);

  const categories = React.useMemo(() => {
    const cats = new Set(['All']);
    publicServices.forEach((s) => {
      if (s.cat) cats.add(s.cat);
    });
    const list = Array.from(cats);
    // "Coming Soon" is its own filter — those services are hidden everywhere else
    if (publicServices.some((s) => s.available === false)) list.push('Coming Soon');
    return list;
  }, [publicServices]);

  const sortedFiltered = React.useMemo(() => {
    if (cat === 'Coming Soon') return publicServices.filter((s) => s.available === false);
    const available = publicServices.filter((s) => s.available !== false);
    return cat === 'All' ? available : available.filter((s) => s.cat === cat);
  }, [publicServices, cat]);

  return (
    <div className="fade-in">
      <section className="section section-soft svc-menu-head">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Full Menu</span>
            <h2>Services &amp; Pricing</h2>
            <p>
              Honest pricing in INR, including all products and aftercare.
              <span className="m-long"> We use Bobbi Brown, MAC, Dyson, Olaplex, and Cosrx — never substitutes.</span>
              <span className="m-short"> Bobbi Brown, MAC, Dyson &amp; more.</span>
            </p>
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
          {/* marquee-on enables the mobile auto-scroll — only worth it with 3+ cards */}
          <div className={'public-svc-grid' + (sortedFiltered.length >= 3 ? ' marquee-on' : '')} style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: '32px',
            marginTop: '16px'
          }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => <SkeletonCard key={idx} />)
            ) : (
              // Cards rendered twice — the duplicate set is hidden on desktop and
              // completes the seamless auto-scroll loop on mobile.
              (sortedFiltered.length >= 3 ? [false, true] : [false]).map((dup) => sortedFiltered.map((s) => {
                const heroSrc = s.hero || 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=900&q=80';
                const isAvailable = s.available !== false;
              return (
                <div key={(dup ? 'dup-' : '') + s.id} aria-hidden={dup || undefined} className={'public-svc-card' + (dup ? ' svc-dup' : '')} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'var(--bg)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                  border: '1px solid var(--line)',
                  opacity: isAvailable ? 1 : 0.85
                }}>
                  {/* Image container with tags */}
                  {isAvailable ? (
                    <Link href={`/booking?service=${s.id}`} style={{ display: 'block', position: 'relative', height: '260px', overflow: 'hidden' }} className="image-link-group">
                      <img src={heroSrc} alt={s.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }} className="card-img" />
                      
                      {/* Dark gradient overlay */}
                      <div className="overlay-tint" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.05)',
                        transition: 'background 0.3s'
                      }} />

                      {/* Category pill tag - top-left */}
                      <div style={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        background: 'rgba(0, 0, 0, 0.65)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {s.cat}
                      </div>

                      {/* Available badge - top-right */}
                      <div style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'rgba(0, 0, 0, 0.65)',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3a7d44' }} />
                        AVAILABLE
                      </div>
                    </Link>
                  ) : (
                    <div style={{ display: 'block', position: 'relative', height: '260px', overflow: 'hidden' }}>
                      <img src={heroSrc} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(100%)', opacity: 0.8 }} />
                      
                      {/* Dark gradient overlay */}
                      <div className="overlay-tint" style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.1)',
                        transition: 'background 0.3s'
                      }} />

                      {/* Category pill tag - top-left */}
                      <div style={{
                        position: 'absolute',
                        top: 16,
                        left: 16,
                        background: 'rgba(0, 0, 0, 0.65)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 600,
                        letterSpacing: '0.12em',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        textTransform: 'uppercase'
                      }}>
                        {s.cat}
                      </div>

                      {/* Available badge - top-right */}
                      <div style={{
                        position: 'absolute',
                        top: 16,
                        right: 16,
                        background: 'rgba(0, 0, 0, 0.65)',
                        color: '#fff',
                        fontSize: '9px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8a7d72' }} />
                        COMING SOON
                      </div>
                    </div>
                  )}

                  {/* Card text metadata & actions */}
                  <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
                      <h3 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '20px',
                        fontWeight: 500,
                        margin: 0,
                        color: 'var(--ink)'
                      }}>
                        {s.name}
                      </h3>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: '18px',
                        color: 'var(--gold-deep)',
                        fontStyle: 'italic',
                        whiteSpace: 'nowrap'
                      }}>
                        {s.price !== undefined && s.price !== null && s.price !== '' ? `₹${Number(s.price).toLocaleString('en-IN')}` : 'On request'}
                      </div>
                    </div>
                    
                    <p style={{
                      fontSize: '13px',
                      color: 'var(--muted)',
                      lineHeight: 1.5,
                      margin: 0,
                      flex: 1
                    }}>
                      {s.desc}
                    </p>

                    {isAvailable ? (
                      <Link href={`/booking?service=${s.id}`} className="btn btn-primary" style={{
                        width: '100%',
                        justifyContent: 'center',
                        borderRadius: '24px',
                        padding: '12px 0',
                        fontWeight: 600,
                        fontSize: '12px',
                        letterSpacing: '0.08em',
                        marginTop: '8px'
                      }}>
                        BOOK APPOINTMENT &nbsp; →
                      </Link>
                    ) : (
                      <button disabled className="btn" style={{
                        width: '100%',
                        justifyContent: 'center',
                        borderRadius: '24px',
                        padding: '12px 0',
                        fontWeight: 600,
                        fontSize: '12px',
                        letterSpacing: '0.08em',
                        marginTop: '8px',
                        background: 'var(--line-2)',
                        color: 'var(--muted)',
                        border: '1px solid var(--line)',
                        cursor: 'not-allowed',
                        opacity: 0.6
                      }}>
                        COMING SOON
                      </button>
                    )}
                  </div>
                </div>
              );
            }))
            )}
          </div>
          </div>
        </div>
        <style>{`
          .image-link-group:hover .card-img {
            transform: scale(1.04);
          }
          .image-link-group:hover .overlay-tint {
            background: rgba(0,0,0,0.1) !important;
          }
          @keyframes shimmer {
            0% { opacity: 0.6; }
            50% { opacity: 1; }
            100% { opacity: 0.6; }
          }
          .skeleton-shimmer {
            animation: shimmer 1.5s infinite ease-in-out;
          }
        `}</style>
      </section>

      <Packages />

      <section className="section section-dark" style={{ padding: '28px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span className="eyebrow">Bridal Consultations</span>
          <h2 style={{ color: 'var(--bg-soft)', marginTop: 8, marginBottom: 8, fontSize: 'clamp(24px, 2.2vw, 34px)' }}>Booking a wedding? <span className="italic" style={{ color: 'var(--gold-tint)' }}>Let&apos;s start with chai.</span></h2>
          <p style={{ color: 'rgba(245,236,223,0.7)', maxWidth: 540, margin: '0 auto 16px', fontSize: 13 }}>Every bride gets a free 45-minute consultation — your story, your dupatta, your skin. We build the look from there.</p>
          <Link className="btn btn-gold" href="/booking?service=bridal">Book a Consultation <IconArrow size={12} /></Link>
        </div>
      </section>
    </div>
  );
}
