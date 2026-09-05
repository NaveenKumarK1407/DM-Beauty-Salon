// Home page — server-rendered for SEO. Navigation via <Link>.
import Link from 'next/link';
import { Marquee } from '@/components/Nav';
import { Packages } from '@/components/Packages';
import { MapEmbed } from '@/components/MapMockup';
import { IconArrow, IconMap, IconPhone, IconClock } from '@/lib/data';
import { listServices, listGallery, listReviews, listPackages, getStudioSettings } from '@/lib/store';
import { getCityFromAddress } from '@/lib/utils';
import { VisitHoursBlock } from '@/components/HoursText';
import { HomepagePopup } from '@/components/HomepagePopup';
import { getHomepagePromotion } from '@/lib/store';

export const dynamic = 'force-dynamic';

function Hero({ city }) {
  return (
    <section className="hero">
      <div className="hero-img-wrap" aria-hidden="true">
        <img src="https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1600&q=85" alt="" />
      </div>
      <div className="hero-text">
        <span className="eyebrow">DM Beauty Parlour · {city}, Telangana</span>
        <h1>Beauty salon<br /><span className="italic">in {city}.</span></h1>
        <p style={{ maxWidth: 480, fontSize: 17, lineHeight: 1.6 }}>
          From a soft Sunday facial to the morning you become a bride — DM Beauty is a small, considered studio for everyday rituals and once-in-a-lifetime looks.
        </p>
        <div className="hero-ctas">
          <Link className="btn btn-primary" href="/booking">Book Appointment <IconArrow size={12} /></Link>
          <Link className="btn btn-ghost" href="/services">Explore Services</Link>
        </div>
        <div className="hero-meta">
          <span>Bridal · Skin · Hair · Nails</span>
        </div>
        <div className="hero-tag">
          <div className="num">Bridal</div>
          <div className="lbl">Explore our makeup services</div>
        </div>
      </div>
    </section>
  );
}

function FeaturedServices({ services }) {
  const items = services.slice(0, 4);
  const scrollItems = [...items, ...items, ...items, ...items];
  return (
    <section className="section home-svc" style={{ overflow: 'hidden' }}>
      <div className="container">
        <div className="section-head home-svc-head">
          <span className="eyebrow">Signature Services</span>
          <h2>An edited menu, refined over years.</h2>
          <p>Every service is performed by Devi or her senior stylists — never rushed, always personal.</p>
        </div>
      </div>
      <div className="card-marquee">
        <div className="card-track">
          {scrollItems.map((s, idx) => (
            <Link key={`${s.id}-${idx}`} className="svc-card" href="/services" style={{ display: 'block' }}>
              <div className="img"><img src={s.hero} alt={s.name} /></div>
              <div className="body">
                <div>
                  <h3 style={{ fontSize: 18, marginBottom: 4 }}>{s.name}</h3>
                  <div className="meta">{s.duration} · {s.cat}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <div className="container view-menu-cta">
        <Link className="btn btn-ghost" href="/services" style={{ border: '1px solid var(--ink)', padding: '12px 24px', borderRadius: '8px' }}>
          View Full Menu <IconArrow size={12} />
        </Link>
      </div>
    </section>
  );
}

function AboutStrip({ city }) {
  return (
    <section className="section section-soft">
      <div className="container">
        <div className="about-two">
          <div className="img">
            <img src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=85" alt="Salon interior inspiration" loading="lazy" />
          </div>
          <div className="body">
            <h2>A second home for women who care about how they feel.</h2>
            <p>DM Beauty began in 2022 as a single chair in Devi Madhuri&apos;s home, styling brides for {city} weddings. Today it&apos;s a four-chair boutique studio — same instinct, same hands.</p>
            <p className="studio-quote">
              &quot;We don&apos;t believe in trends that age you. We believe in skin you can touch, hair that moves, and makeup that looks like <em>you</em> — just on your best day.&quot;
            </p>
            {/* Metrics hidden for now — restore by uncommenting
            <div className="metrics">
              <div className="metric"><div className="n">2,400+</div><div className="l">Brides styled</div></div>
              <div className="metric"><div className="n">312</div><div className="l">5★ reviews</div></div>
              <div className="metric"><div className="n">8</div><div className="l">Years open</div></div>
            </div>
            */}
          </div>
        </div>
      </div>
    </section>
  );
}

function GalleryPreview({ gallery }) {
  if (!gallery || gallery.length === 0) {
    return null;
  }
  const preview = gallery.slice(0, 5);
  
  // Custom grid style depending on the number of images available
  let gridStyle = { display: 'grid', gap: 12 };
  if (preview.length >= 3) {
    gridStyle = {
      ...gridStyle,
      gridTemplateColumns: '1.4fr 1fr 1fr',
      gridTemplateRows: '280px 280px',
    };
  } else if (preview.length === 2) {
    gridStyle = {
      ...gridStyle,
      gridTemplateColumns: '1.1fr 1fr',
      gridTemplateRows: '320px',
    };
  } else {
    gridStyle = {
      ...gridStyle,
      gridTemplateColumns: '1fr',
      gridTemplateRows: '360px',
    };
  }

  return (
    <section className="section section-dark">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow">Recent Work</span>
          <h2 style={{ color: 'var(--bg-soft)' }}>Explore our<br /><span className="italic" style={{ color: 'var(--gold-tint)' }}>beauty gallery.</span></h2>
        </div>
        <div className="public-svc-scroll">
        <div className={'home-gallery-grid' + (preview.length >= 3 ? ' marquee-on' : '')} style={gridStyle}>
          {/* Duplicate set completes the mobile auto-scroll loop; hidden on desktop */}
          {(preview.length >= 3 ? [false, true] : [false]).map((dup) => preview.map((g, i) => (
            <div key={(dup ? 'dup-' : '') + g.id} aria-hidden={dup || undefined}
              className={dup ? 'svc-dup' : undefined}
              style={{
                gridRow: !dup && i === 0 && preview.length >= 3 ? 'span 2' : undefined,
                overflow: 'hidden',
                borderRadius: 4
              }}>
              <img src={g.src} alt={g.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )))}
        </div>
        </div>
        <div className="view-menu-cta">
          <Link className="btn btn-gold" href="/gallery">See Full Gallery <IconArrow size={12} /></Link>
        </div>
      </div>
    </section>
  );
}

function Testimonials({ reviews }) {
  // Only display reviews supplied through the salon's review catalogue.
  const items = Array.isArray(reviews) ? reviews : [];
  if (items.length === 0) return null;
  return (
    <section className="section section-soft" style={{ padding: '32px 0', overflow: 'hidden' }}>
      <div className="container">
        <div className="section-head" style={{ marginBottom: '20px', gap: '4px' }}>
          <span className="eyebrow">Kind Words</span>
          <h2 style={{ fontSize: 'clamp(20px, 4.5vw, 26px)', whiteSpace: 'nowrap', margin: 0 }}>The compliment that keeps us going.</h2>
        </div>
      </div>
      <div className="testi-marquee">
        <div className="testi-track">
          {[...items, ...items, ...items, ...items].map((t, i) => (
            <div key={i} className="testi">
              <div className="stars">{'★'.repeat(Math.min(5, Math.max(1, t.stars || 5)))}</div>
              <div className="quote">&quot;{t.quote}&quot;</div>
              <div className="who">
                <div className="avatar avatar-initial">{t.name.charAt(0).toUpperCase()}</div>
                <div>
                  <div className="name">{t.name}</div>
                  <div className="role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactPreview({ settings }) {
  const address = settings?.address || '2nd Floor, Above Pochamma Maidan, Medak 502110';
  const phone = settings?.phone || '+91 98765 43210';
  const city = getCityFromAddress(address);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  return (
    <section className="section">
      <div className="container">
        <div className="visit-card">
          <div className="visit-card-info">
            <span className="eyebrow">Visit Us</span>
            <h2 style={{ fontSize: 'clamp(22px, 2.1vw, 32px)' }}>Visit our Salon, <span className="italic">in {city}.</span></h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>Drop in any time, or call ahead for the chair you want. Free parking in the lane behind the building.</p>
            <div className="info-row visit-row">
              <div className="info-icon"><IconMap /></div>
              <div><h4>Address</h4><div className="val" style={{ fontSize: 14, lineHeight: 1.4 }}>{address}</div></div>
            </div>
            <div className="info-row visit-row">
              <div className="info-icon"><IconPhone /></div>
              <div><h4>Reservations</h4><div className="visit-phone"><a href={`tel:${phone.replace(/\s/g, '')}`}>{phone}</a></div></div>
            </div>
            <div className="info-row visit-row">
              <div className="info-icon"><IconClock /></div>
              <div>
                <h4>Hours</h4>
                <VisitHoursBlock settings={settings} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              <Link className="btn btn-primary" href="/booking">Book a Chair</Link>
              <a className="btn btn-ghost desktop-only" href={mapsUrl} target="_blank" rel="noopener noreferrer">Get Directions <IconArrow size={12} /></a>
            </div>
          </div>
          <div className="visit-card-map">
            <MapEmbed address={address} />
            {/* Whole map opens the location — sits under the place card */}
            <a className="map-click-overlay" href={mapsUrl} target="_blank" rel="noopener noreferrer" aria-label="Open location in Google Maps" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const [services, gallery, reviews, packages, settings, promotion] = await Promise.all([
    listServices(),
    listGallery(),
    listReviews(),
    listPackages(),
    getStudioSettings(),
    getHomepagePromotion().catch(() => null),
  ]);
  const city = getCityFromAddress(settings?.address);

  return (
    <div className="fade-in">
      <HomepagePopup key={promotion?.updatedAt || 'no-promotion'} promotion={promotion?.enabled ? promotion : null} />
      <Hero city={city} />
      <Marquee />
      <FeaturedServices services={services} />
      <AboutStrip city={city} />
      <Packages initialPackages={packages} />
      <GalleryPreview gallery={gallery} />
      <Testimonials reviews={reviews} />
      <ContactPreview settings={settings} />
    </div>
  );
}
