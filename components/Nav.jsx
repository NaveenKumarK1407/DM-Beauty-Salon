'use client';
// Top nav + mobile drawer + Marquee + Footer, adapted for Next.js routing.
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { IconArrow, IconClock, IconMap } from '@/lib/data';
import { ThemeToggle } from './ThemeToggle';
import { Socials } from './Socials';
import { useSettings } from '@/lib/settings';
import { getCityFromAddress, isStudioOpen, getMobileBrandStatus } from '@/lib/utils';
import { getFooterHoursParts } from '@/lib/hours';
import { VisitHoursBlock } from './HoursText';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/contact', label: 'Contact' },
];

// Header location pill — shows the studio city; click opens a popover with the
// full address, hours and a Google Maps directions link. Single-studio business,
// so this is an info dropdown, not a multi-location switcher.
function LocationDropdown({ settings, city, isOpen }) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const address = settings?.address || 'Medak, Telangana 502110';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <div className="loc-dd desktop-only" ref={ref}>
      <button className="loc-pill" onClick={() => setMenuOpen((o) => !o)} aria-label="Studio location">
        <IconMap />
        <span>{city}</span>
        <svg className={'loc-chev' + (menuOpen ? ' up' : '')} width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {menuOpen && (
        <div className="loc-menu">
          <div className="loc-menu-head">
            <span className="eyebrow muted">Our Studio</span>
            <span className="loc-status" style={{ color: isOpen ? 'var(--success)' : 'var(--danger)' }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
              {isOpen ? 'OPEN' : 'CLOSED'}
            </span>
          </div>
          <div className="loc-addr">{address}</div>
          <div className="loc-hours"><VisitHoursBlock settings={settings} /></div>
          <a className="loc-directions" href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <IconMap /> Get Directions
          </a>
        </div>
      )}
    </div>
  );
}

export function TopNav() {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { settings } = useSettings();

  // Warm route bundles in the background so menu clicks feel instant.
  React.useEffect(() => {
    LINKS.forEach((l) => router.prefetch(l.href));
    router.prefetch('/booking');
  }, [router]);
  const isActive = (href) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const city = settings?.address ? getCityFromAddress(settings.address) : 'Medak';
  const isOpen = isStudioOpen(settings);
  const mobileBrand = getMobileBrandStatus(settings);

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <div className="nav-start">
            <Link href="/" className="nav-logo" aria-label="DM Beauty Parlour home">
              <Image src="/dm_logo.png" alt="" width={72} height={72} priority />
            </Link>
            <nav className="nav-links">
              {LINKS.map((l) => (
                <Link key={l.href} href={l.href} className={'nav-link ' + (isActive(l.href) ? 'active' : '')}>
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link href="/" className="brand">
            {settings.name || 'DM Beauty'}
            <small className="brand-sub">
              <span className="brand-city">{city}</span>
              <span className="brand-day">
                {mobileBrand.prefix && (
                  <>
                    <span className="brand-day-prefix">{mobileBrand.prefix}</span>
                    <span className="brand-day-sep" aria-hidden="true">·</span>
                  </>
                )}
                <span className={'brand-day-status' + (mobileBrand.isOpen ? ' is-open' : ' is-closed')}>
                  <span className="brand-day-dot" aria-hidden="true" />
                  {mobileBrand.status}
                </span>
              </span>
              <span className="brand-status" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                color: isOpen ? 'var(--success)' : 'var(--danger)',
                fontWeight: 700,
                fontSize: '8px'
              }}>
                <span style={{ width: 4, height: 4, borderRadius: '50%', background: isOpen ? 'var(--success)' : 'var(--danger)' }} />
                {isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </small>
          </Link>
          <div className="nav-actions">
            <LocationDropdown settings={settings} city={city} isOpen={isOpen} />
            <ThemeToggle className="desktop-only" />
            <Link href="/booking" className="btn btn-primary nav-book-btn">
              <span className="book-label-long">Book Now</span>
              <span className="book-label-short">Book</span>
              <span className="desktop-only" style={{ display: 'inline-flex' }}><IconArrow size={12} /></span>
            </Link>
            <button className="nav-burger" onClick={() => setOpen((o) => !o)} aria-label="Open menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      {open && <div className="mobile-overlay" onClick={() => setOpen(false)} />}
      <aside className={'mobile-menu ' + (open ? 'open' : '')}>
        <div className="mm-head">
          <Link href="/" className="mm-brand-row" onClick={() => setOpen(false)}>
            <Image src="/dm_logo.png" alt="" width={44} height={44} className="mm-logo" />
            <div className="brand" style={{ textAlign: 'left' }}>
              {settings.name || 'DM Beauty'}
              <small style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {city} ·
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  color: isOpen ? 'var(--success)' : 'var(--danger)',
                  fontWeight: 700,
                  fontSize: '8px'
                }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: isOpen ? 'var(--success)' : 'var(--danger)' }} />
                  {isOpen ? 'OPEN' : 'CLOSED'}
                </span>
              </small>
            </div>
          </Link>
          <button onClick={() => setOpen(false)} style={{ fontSize: 24, color: 'var(--muted)' }}>✕</button>
        </div>
        <nav className="mm-links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
              className={'mm-link ' + (isActive(l.href) ? 'active' : '')}>{l.label}<IconArrow size={14} /></Link>
          ))}
          <Link href="/booking" onClick={() => setOpen(false)} className="mm-link" style={{ color: 'var(--gold-deep)' }}>Book Appointment<IconArrow size={14} /></Link>
        </nav>
        <div className="mm-foot">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <span className="eyebrow muted">Appearance</span>
            <ThemeToggle />
          </div>
          <div className="eyebrow muted" style={{ marginBottom: 12 }}>Visit Us</div>
          <div style={{ fontFamily: 'var(--font-body)', fontSize: 17, fontWeight: 700, letterSpacing: '0.04em', marginBottom: 4 }}>
            <a href={`tel:${(settings.phone || '').replace(/\s+/g, '')}`}>{settings.phone}</a>
          </div>
          <VisitHoursBlock settings={settings} />
        </div>
      </aside>
    </>
  );
}

export function Marquee() {
  const { settings } = useSettings();
  const city = settings?.address ? getCityFromAddress(settings.address) : 'Medak';
  const items = [
    'Bridal Editions',
    'Walk-ins Welcome',
    'Open Tue–Sun',
    'HD & Airbrush',
    `Studio in ${city}`,
    'Bridal Editions',
    'Walk-ins Welcome',
    'Open Tue–Sun',
    'HD & Airbrush',
    `Studio in ${city}`,
  ];
  return (
    <div className="marquee">
      <div className="marquee-track">
        {items.map((s, i) => <span key={i} className="marquee-item">{s}</span>)}
      </div>
    </div>
  );
}

export function Footer() {
  const { settings } = useSettings();
  const pathname = usePathname();
  const isActive = (href) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));
  const isOpen = isStudioOpen(settings);
  const mapsUrl = settings?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
    : 'https://maps.google.com';
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <Link href="/" className="footer-brand-row">
              <Image src="/dm_logo.png" alt="" width={52} height={52} className="footer-logo" />
              <div className="brand">{settings.name || 'DM Beauty'}<small>Est. 2022</small></div>
            </Link>
            <p>A studio for everyday beauty rituals and once-in-a-lifetime bridal moments.</p>
            {/* Hours — above social icons: open hours · live status │ closed days */}
            {(() => {
              const { hoursLine, statusLabel, closedParts, rightSide, statusColor } = getFooterHoursParts(settings, isOpen);
              return (
                <div className="footer-hours-badge">
                  <span className="fh-hours">{hoursLine}</span>
                  <span className="fh-dot">·</span>
                  <span className="fh-status" style={{ color: statusColor }}>
                    {statusLabel}
                  </span>
                  <span className="fh-sep">|</span>
                  {closedParts.length > 0 ? (
                    <span className="fh-today">
                      {closedParts.map((part, i) => {
                        const [day] = part.split(' · ');
                        return (
                          <span key={day}>
                            {i > 0 && ', '}
                            {day} · <span className="hours-closed">CLOSED</span>
                          </span>
                        );
                      })}
                    </span>
                  ) : (
                    <span className="fh-today">
                      {rightSide.split(' · ')[0]} ·{' '}
                      <span className={isOpen ? 'fh-open' : 'hours-closed'}>{statusLabel}</span>
                    </span>
                  )}
                </div>
              );
            })()}
            {/* Social icons — below hours */}
            <div style={{ marginTop: 12 }}>
              <Socials />
            </div>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link href="/" className={isActive('/') ? 'active' : ''}>Home</Link></li>
              <li><Link href="/services" className={isActive('/services') ? 'active' : ''}>Services</Link></li>
              <li><Link href="/gallery" className={isActive('/gallery') ? 'active' : ''}>Gallery</Link></li>
              <li><Link href="/booking" className={isActive('/booking') ? 'active' : ''}>Book Appointment</Link></li>
              <li><Link href="/contact" className={isActive('/contact') ? 'active' : ''}>Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>Visit</h4>
            <ul>
              <li>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="footer-address-link">
                  {settings.address}
                </a>
              </li>
              <li><a href={`tel:${(settings.phone || '').replace(/\s+/g, '')}`} className="footer-contact-link">{settings.phone}</a></li>
              <li><a href={`mailto:${settings.email}`} className="footer-contact-link">{settings.email}</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bot">
          <div>
            © 2026 {settings.name || 'DM Beauty Parlour'}. All rights reserved. · Created by{' '}
            <a
              href="https://in.linkedin.com/in/naveen-kumar-kusangi-721b5826b"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-credit-name"
            >
              Naveen Kusangi
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
