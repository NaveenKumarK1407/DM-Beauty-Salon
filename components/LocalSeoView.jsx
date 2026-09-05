// Body of the /beauty-parlour-in-medak local landing page. A server component on
// purpose: the copy, headings and FAQ answers must be in the initial HTML for
// Google to index them, and none of it needs interactivity.
import Link from 'next/link';
import { IconArrow, IconMap, IconPhone, IconClock } from '@/lib/data';
import {
  MEDAK_FAQS,
  MEDAK_AREAS,
  MEDAK_SERVICE_GROUPS,
  MEDAK_TRUST_POINTS,
} from '@/lib/localSeo';

export function LocalSeoBody({ city, name, address, phone, email, hours, services = [] }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  const telHref = `tel:${String(phone).replace(/\s+/g, '')}`;

  // Cheapest published price per group. Prices are optional in the admin panel,
  // so this returns null whenever the studio has not entered real numbers — the
  // badge is then omitted rather than showing a bogus "From ₹0".
  const priceFrom = (cats) => {
    const prices = services
      .filter((s) => cats.includes(s.cat))
      .map((s) => Number(s.price))
      .filter((p) => Number.isFinite(p) && p > 0);
    return prices.length ? Math.min(...prices) : null;
  };

  // Names the studio actually offers in this group, so each card lists real
  // services instead of only the generic description.
  const namesIn = (cats) =>
    services.filter((s) => cats.includes(s.cat) && s.name).map((s) => s.name);

  return (
    <div className="fade-in local-seo">
      <style>{`
        .local-seo .lseo-hero { padding: 44px 0 32px; }
        .local-seo .lseo-hero h1 { font-size: clamp(30px, 4.4vw, 54px); line-height: 1.08; max-width: 16ch; }
        .local-seo .lseo-lede { font-size: 16px; line-height: 1.65; max-width: 62ch; color: var(--muted); margin-top: 14px; }
        .local-seo .lseo-cta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 22px; }
        .local-seo .lseo-facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-top: 30px; }
        .local-seo .lseo-fact { border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; }
        .local-seo .lseo-fact h3 { font-family: var(--font-body); font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--muted); font-weight: 500; margin-bottom: 6px; }
        .local-seo .lseo-fact p { font-size: 14px; line-height: 1.5; margin: 0; }
        .local-seo .lseo-fact a { color: inherit; }
        .local-seo .lseo-fact a:hover { color: var(--gold); }
        .local-seo .lseo-prose { max-width: 68ch; }
        .local-seo .lseo-prose p { font-size: 15px; line-height: 1.72; color: var(--muted); margin-bottom: 14px; }
        .local-seo .lseo-svc { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; margin-top: 24px; }
        .local-seo .lseo-svc article { border: 1px solid var(--line); border-radius: 12px; padding: 20px; }
        .local-seo .lseo-svc h3 { font-size: 20px; margin-bottom: 8px; }
        .local-seo .lseo-svc p { font-size: 14px; line-height: 1.6; color: var(--muted); margin: 0; }
        .local-seo .lseo-offered { font-size: 13px; line-height: 1.6; color: var(--muted); margin: 10px 0 0; }
        .local-seo .lseo-offered strong { color: var(--ink); font-weight: 500; }
        .local-seo .lseo-price { display: inline-block; margin-top: 12px; font-family: var(--font-body); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold-deep); }
        .local-seo .lseo-trust { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 24px; }
        .local-seo .lseo-trust h3 { font-size: 17px; margin-bottom: 6px; }
        .local-seo .lseo-trust p { font-size: 13.5px; line-height: 1.6; color: var(--muted); margin: 0; }
        .local-seo .lseo-areas { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
        .local-seo .lseo-area { border: 1px solid var(--line); border-radius: 999px; padding: 6px 14px; font-size: 13px; color: var(--muted); }
        .local-seo .lseo-faq { max-width: 76ch; margin-top: 22px; display: flex; flex-direction: column; gap: 4px; }
        .local-seo .lseo-faq details { border-bottom: 1px solid var(--line); padding: 14px 0; }
        .local-seo .lseo-faq summary { cursor: pointer; list-style: none; font-family: var(--font-display); font-size: 18px; line-height: 1.35; display: flex; justify-content: space-between; gap: 16px; align-items: baseline; }
        .local-seo .lseo-faq summary::-webkit-details-marker { display: none; }
        .local-seo .lseo-faq summary::after { content: '+'; color: var(--gold); font-size: 20px; line-height: 1; }
        .local-seo .lseo-faq details[open] summary::after { content: '–'; }
        .local-seo .lseo-faq p { font-size: 14.5px; line-height: 1.7; color: var(--muted); margin: 10px 0 2px; }
        .local-seo .lseo-links { display: flex; flex-wrap: wrap; gap: 10px 20px; margin-top: 16px; font-size: 14px; }
        .local-seo .lseo-links a { border-bottom: 1px solid var(--line); padding-bottom: 2px; }
        .local-seo .lseo-links a:hover { color: var(--gold); border-color: var(--gold); }
        @media(max-width:860px) {
          .local-seo .lseo-svc, .local-seo .lseo-trust { grid-template-columns: 1fr; }
          .local-seo .lseo-facts { grid-template-columns: 1fr; }
        }
      `}</style>

      <section className="section lseo-hero">
        <div className="container">
          <span className="eyebrow">{city}, Telangana 502110</span>
          <h1>
            Beauty Parlour in {city} — <span className="italic">bridal &amp; everyday.</span>
          </h1>
          <p className="lseo-lede">
            {name} is a ladies beauty parlour and bridal makeup studio in the heart of {city}. HD and
            airbrush bridal makeup, haircuts and colour, facials, gel nails, waxing and threading —
            all under one roof, with prices published upfront. Walk in when we are open, or book your
            slot in a minute.
          </p>
          <div className="lseo-cta">
            <Link href="/booking" className="btn btn-primary">
              Book an Appointment <IconArrow size={12} />
            </Link>
            <a href={telHref} className="btn btn-ghost">
              <IconPhone /> Call {phone}
            </a>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <IconMap /> Get Directions
            </a>
          </div>

          <div className="lseo-facts">
            <div className="lseo-fact">
              <h3>Address</h3>
              <p>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">{address}</a>
              </p>
            </div>
            <div className="lseo-fact">
              <h3>Opening Hours</h3>
              <p>{hours}</p>
            </div>
            <div className="lseo-fact">
              <h3>Call or WhatsApp</h3>
              <p>
                <a href={telHref}>{phone}</a>
                <br />
                <a href={`mailto:${email}`}>{email}</a>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-soft" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="container">
          <div className="section-head left" style={{ marginBottom: 8 }}>
            <span className="eyebrow">Why {city} books with us</span>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)' }}>
              The beauty parlour {city} <span className="italic">actually recommends.</span>
            </h2>
          </div>
          <div className="lseo-prose">
            <p>
              Finding a beauty parlour in {city} that handles a full bridal day as carefully as a
              Tuesday threading appointment is harder than it should be. {name} was built for exactly
              that — a private studio where a bride gets an unhurried trial before the wedding, and
              where a walk-in for a facial or a haircut gets the same products and the same attention.
            </p>
            <p>
              Every look is done in-house by Devi Madhuri. There is no rotating chair of freelancers
              and no upselling at the counter: you see the price list before you sit down, and the
              quote you get at booking is the amount you pay.
            </p>
          </div>
          <div className="lseo-trust">
            {MEDAK_TRUST_POINTS.map((t) => (
              <div key={t.title}>
                <h3>{t.title}</h3>
                <p>{t.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="container">
          <div className="section-head left" style={{ marginBottom: 4 }}>
            <span className="eyebrow">Services</span>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)' }}>
              What we do in <span className="italic">{city}</span>
            </h2>
          </div>
          <div className="lseo-svc">
            {MEDAK_SERVICE_GROUPS.map((g) => {
              const from = priceFrom(g.cats);
              const names = namesIn(g.cats);
              return (
                <article key={g.heading}>
                  <h3>{g.heading}</h3>
                  <p>{g.body}</p>
                  {names.length > 0 && (
                    <p className="lseo-offered">
                      <strong>On the menu:</strong> {names.join(' · ')}
                    </p>
                  )}
                  {from != null && (
                    <span className="lseo-price">From ₹{from.toLocaleString('en-IN')}</span>
                  )}
                </article>
              );
            })}
          </div>
          <div className="lseo-cta">
            <Link href="/services" className="btn btn-ghost">
              See all services &amp; prices <IconArrow size={12} />
            </Link>
            <Link href="/gallery" className="btn btn-ghost">
              Browse the bridal gallery <IconArrow size={12} />
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-soft" style={{ paddingTop: 40, paddingBottom: 40 }}>
        <div className="container">
          <div className="section-head left" style={{ marginBottom: 4 }}>
            <span className="eyebrow"><IconMap /> Areas we serve</span>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)' }}>
              {city} district <span className="italic">and around.</span>
            </h2>
          </div>
          <div className="lseo-prose">
            <p>
              The studio sits in central {city}, a short ride from the bus stand, Medak Fort Road and
              the Pochamma Maidan area. For weddings we also travel across the district — so if you
              are searching for a bridal makeup artist near any of these places, we cover you.
            </p>
          </div>
          <div className="lseo-areas">
            {MEDAK_AREAS.map((a) => (
              <span key={a} className="lseo-area">{a}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 40, paddingBottom: 48 }}>
        <div className="container">
          <div className="section-head left" style={{ marginBottom: 4 }}>
            <span className="eyebrow"><IconClock /> Questions</span>
            <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)' }}>
              Before you book, <span className="italic">the honest answers.</span>
            </h2>
          </div>
          <div className="lseo-faq">
            {MEDAK_FAQS.map((f, i) => (
              <details key={f.q} open={i === 0}>
                <summary>{f.q}</summary>
                <p>{f.a({ city, phone, address, hours })}</p>
              </details>
            ))}
          </div>

          <div style={{ marginTop: 32 }}>
            <div className="eyebrow muted" style={{ marginBottom: 4 }}>More on this site</div>
            <div className="lseo-links">
              <Link href="/">Home</Link>
              <Link href="/services">Services &amp; Pricing</Link>
              <Link href="/gallery">Bridal Gallery</Link>
              <Link href="/booking">Book an Appointment</Link>
              <Link href="/contact">Contact &amp; Directions</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
