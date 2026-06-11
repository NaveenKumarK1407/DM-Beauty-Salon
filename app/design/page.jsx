import './design.css';
import Link from 'next/link';
import { PrintToolbar } from '@/components/PrintToolbar';

export const metadata = {
  title: 'Design Document',
  description:
    'The DM Beauty Parlour visual language — color palette, typography, components and tokens, in light and dark. A printable design document.',
  alternates: { canonical: '/design' },
  robots: { index: false, follow: true },
};

const SCREENS = [
  { no: '01', title: 'Home', meta: 'Storefront', href: '/' },
  { no: '02', title: 'Services', meta: 'Menu & pricing', href: '/services' },
  { no: '03', title: 'Gallery', meta: 'Selected work', href: '/gallery' },
  { no: '04', title: 'Booking', meta: 'Appointment flow', href: '/booking' },
  { no: '05', title: 'Contact', meta: 'Visit & reach', href: '/contact' },
  { no: '06', title: 'Admin', meta: 'Private dashboard', href: '/admin' },
];

function Swatch({ bg, nm, hx, tone = 'on-light', border }) {
  return (
    <div className={`ds-swatch ${tone}`} style={{ background: bg, ...(border ? { borderColor: 'var(--line)' } : {}) }}>
      <div className="nm">{nm}</div>
      <div className="hx">{hx}</div>
    </div>
  );
}

export default function DesignDocumentPage() {
  return (
    <div className="designdoc">
      <PrintToolbar />
      <div className="ds">

        {/* ── Cover ── */}
        <section className="ds-page ds-cover">
          <div className="ds-mark">DM Beauty Parlour<small>EST · MEDAK · TELANGANA</small></div>
          <div className="ds-cover-headline">
            <div className="ds-eyebrow" style={{ marginBottom: 22 }}>Website Design Document · v1.0</div>
            <h1 className="ds-h">Quiet luxury for<br /><span className="italic">every&nbsp;day rituals.</span></h1>
            <p className="ds-lede">A small editorial beauty studio brand — built on restraint, warmth and craft. This document records the full visual language, every component, and all six screens of the website.</p>
            <div className="ds-stats">
              <div className="ds-stat"><div className="n">6</div><div className="l">Screens</div></div>
              <div className="ds-stat"><div className="n">14</div><div className="l">Colors</div></div>
              <div className="ds-stat"><div className="n">2</div><div className="l">Typefaces</div></div>
              <div className="ds-stat"><div className="n">2</div><div className="l">Themes</div></div>
            </div>
          </div>
          <div className="ds-foot"><span>A studio document · 2026</span><span>DM Beauty Parlour</span></div>
        </section>

        {/* ── 01 · Color ── */}
        <section className="ds-page">
          <div className="ds-head-row">
            <span className="ds-secno">01</span>
            <h2 className="ds-h">Color</h2>
            <span className="meta">Editorial warm neutrals · champagne gold · ink. Force “background graphics” on when printing.</span>
          </div>

          <div className="ds-col-group">
            <div className="ds-col-title">Brand · Gold &amp; Rose</div>
            <div className="ds-col-row">
              <Swatch bg="#ecdcc5" nm="gold / tint" hx="#ECDCC5" />
              <Swatch bg="#b58e63" nm="gold" hx="#B58E63" />
              <Swatch bg="#8c6a44" nm="gold / deep" hx="#8C6A44" tone="on-dark" />
              <Swatch bg="#d9a89b" nm="rose" hx="#D9A89B" />
              <Swatch bg="#4a7a5a" nm="success" hx="#4A7A5A" tone="on-dark" />
              <Swatch bg="#c97a4a" nm="warn" hx="#C97A4A" tone="on-dark" />
            </div>
          </div>

          <div className="ds-col-group">
            <div className="ds-col-title">Surface · Warm Neutrals</div>
            <div className="ds-col-row">
              <Swatch bg="#ffffff" nm="bg" hx="#FFFFFF" border />
              <Swatch bg="#fbf7f2" nm="bg / soft" hx="#FBF7F2" />
              <Swatch bg="#f5ecdf" nm="bg / cream" hx="#F5ECDF" />
              <Swatch bg="#ebe3d8" nm="line" hx="#EBE3D8" />
              <Swatch bg="#d9cdbd" nm="line / 2" hx="#D9CDBD" />
              <Swatch bg="#8a7d72" nm="muted" hx="#8A7D72" tone="on-dark" />
            </div>
          </div>

          <div className="ds-col-group">
            <div className="ds-col-title">Ink · Text</div>
            <div className="ds-col-row">
              <Swatch bg="#1a1a1a" nm="ink" hx="#1A1A1A" tone="on-dark" />
              <Swatch bg="#3a322c" nm="ink / 2" hx="#3A322C" tone="on-dark" />
              <Swatch bg="#b04a4a" nm="danger" hx="#B04A4A" tone="on-dark" />
              <Swatch bg="#0f0d0a" nm="dark bg" hx="#0F0D0A" tone="on-dark" />
              <Swatch bg="#f1e7d4" nm="dark ink" hx="#F1E7D4" />
              <Swatch bg="#d4a875" nm="dark gold" hx="#D4A875" />
            </div>
          </div>

          <div className="ds-foot"><span>DM Beauty Parlour · Design Document</span><span>01 · Color</span></div>
        </section>

        {/* ── 02 · Typography ── */}
        <section className="ds-page">
          <div className="ds-head-row">
            <span className="ds-secno">02</span>
            <h2 className="ds-h">Typography</h2>
            <span className="meta">A serif display voice over a quiet grotesque body.</span>
          </div>

          <div className="ds-fonts" style={{ marginBottom: 40 }}>
            <div className="ds-font-card">
              <div className="big" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Aa</div>
              <div className="nm">Display · Cormorant Garamond</div>
              <div className="set" style={{ fontFamily: "'Cormorant Garamond', serif" }}>ABCDEFGHIJKLM · abcdefghijk · 1234567890</div>
            </div>
            <div className="ds-font-card">
              <div className="big" style={{ fontFamily: "'Jost', sans-serif", fontWeight: 400 }}>Aa</div>
              <div className="nm">Body · Jost</div>
              <div className="set" style={{ fontFamily: "'Jost', sans-serif" }}>ABCDEFGHIJKLM · abcdefghijk · 1234567890</div>
            </div>
          </div>

          <div>
            <div className="ds-type-row">
              <div className="lbl">Display</div><div className="fam">Cormorant · 500</div>
              <div className="sample" style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 1 }}>Every day <span style={{ fontStyle: 'italic', color: 'var(--gold-deep)' }}>rituals</span></div>
            </div>
            <div className="ds-type-row">
              <div className="lbl">Title</div><div className="fam">Cormorant · 500</div>
              <div className="sample" style={{ fontFamily: 'var(--font-display)', fontSize: 34 }}>Care made considered</div>
            </div>
            <div className="ds-type-row">
              <div className="lbl">Headline</div><div className="fam">Cormorant · 500</div>
              <div className="sample" style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>Bridal · Hair · Skin · Brow</div>
            </div>
            <div className="ds-type-row">
              <div className="lbl">Body</div><div className="fam">Jost · 400</div>
              <div className="sample" style={{ fontSize: 16 }}>A small studio at the centre of Medak, where every appointment is private and unhurried.</div>
            </div>
            <div className="ds-type-row">
              <div className="lbl">Eyebrow</div><div className="fam">Jost · 500</div>
              <div className="sample"><span className="ds-eyebrow">Established 2026 · Telangana</span></div>
            </div>
            <div className="ds-type-row">
              <div className="lbl">Price</div><div className="fam">Cormorant italic</div>
              <div className="sample" style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--gold-deep)', fontSize: 30 }}>₹2,400 · ₹4,800 · ₹12,000</div>
            </div>
          </div>

          <div className="ds-foot"><span>DM Beauty Parlour · Design Document</span><span>02 · Typography</span></div>
        </section>

        {/* ── 03 · Components ── */}
        <section className="ds-page">
          <div className="ds-head-row">
            <span className="ds-secno">03</span>
            <h2 className="ds-h">Components</h2>
            <span className="meta">Buttons · chips · status · forms · time slots · tokens.</span>
          </div>

          <div className="ds-grid-2">
            <div className="ds-comp">
              <h4>Buttons</h4>
              <div className="ds-row">
                <span className="btn btn-primary">Book Now</span>
                <span className="btn btn-ghost">Explore</span>
                <span className="btn btn-gold">Bridal Package</span>
              </div>
            </div>
            <div className="ds-comp">
              <h4>Category chips</h4>
              <div className="ds-row">
                <span className="ds-chip active">All</span>
                <span className="ds-chip">Bridal</span>
                <span className="ds-chip">Hair</span>
                <span className="ds-chip">Skin</span>
                <span className="ds-chip">Makeup</span>
              </div>
            </div>
            <div className="ds-comp">
              <h4>Booking status</h4>
              <div className="ds-row">
                <span className="ds-pill ok">Confirmed</span>
                <span className="ds-pill pend">Pending</span>
                <span className="ds-pill">Completed</span>
              </div>
            </div>
            <div className="ds-comp">
              <h4>Form field</h4>
              <div className="ds-field">
                <label>Phone number</label>
                <div className="inp">+91 98765 43210</div>
              </div>
            </div>
            <div className="ds-comp">
              <h4>Time slots</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                <div className="ds-slot busy">9:00</div><div className="ds-slot">9:30</div>
                <div className="ds-slot sel">10:00</div><div className="ds-slot">10:30</div>
                <div className="ds-slot">11:00</div><div className="ds-slot busy">11:30</div>
                <div className="ds-slot">12:00</div><div className="ds-slot">12:30</div>
              </div>
            </div>
            <div className="ds-comp">
              <h4>Radius &amp; spacing</h4>
              <div className="ds-radius-row">
                <div><div className="box" style={{ borderRadius: 0 }} /><div className="l">0</div></div>
                <div><div className="box" style={{ borderRadius: 6 }} /><div className="l">6 · md</div></div>
                <div><div className="box" style={{ borderRadius: 999 }} /><div className="l">pill</div></div>
                <div style={{ marginLeft: 8 }} className="ds-scale-row">
                  <div><div className="bar" style={{ width: 8, height: 16 }} /><div className="l">8</div></div>
                  <div><div className="bar" style={{ width: 8, height: 32 }} /><div className="l">32</div></div>
                  <div><div className="bar" style={{ width: 8, height: 64 }} /><div className="l">120</div></div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 28 }}>
            <div className="ds-col-title">Marquee · section transition</div>
            <div className="ds-marquee">Bridal · Hair · Skin <span className="sep">✦</span> Brows · Lash · Nails <span className="sep">✦</span> Makeup · Threading <span className="sep">✦</span> A studio at Medak</div>
          </div>

          <div className="ds-foot"><span>DM Beauty Parlour · Design Document</span><span>03 · Components</span></div>
        </section>

        {/* ── 04 · Screens divider + index ── */}
        <section className="ds-page ds-section-head">
          <div className="ds-eyebrow" style={{ color: 'var(--gold-tint)', marginBottom: 18 }}>04 · The website · Light</div>
          <div style={{ marginTop: 'auto' }}>
            <h2 className="ds-h">Six screens.<br /><span className="italic">One quiet voice.</span></h2>
            <p className="ds-lede">From the storefront homepage to a private admin console — every page is a live route in the product. Open any one below.</p>
            <div className="ds-screens">
              {SCREENS.map((s) => (
                <Link key={s.no} href={s.href} className="ds-screen-card">
                  <span className="no">{s.no}</span>
                  <span className="ti">{s.title}</span>
                  <span className="me">{s.meta}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="ds-foot"><span>DM Beauty Parlour · Design Document</span><span>04 · Screens · Light</span></div>
        </section>

        {/* ── 05 · Dark mode ── */}
        <div className="theme-dark">
          <section className="ds-page on-dark" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="ds-eyebrow" style={{ color: 'var(--gold)', marginBottom: 18 }}>05 · The website · Dark</div>
            <div style={{ marginTop: 'auto' }}>
              <h2 className="ds-h" style={{ color: 'var(--ink)', fontSize: 92 }}>The night room.</h2>
              <p className="ds-lede" style={{ color: 'var(--ink-2)' }}>The same studio, dressed for low light — deep charcoal surfaces, warm gold that glows. Toggle dark mode anywhere from the appearance panel.</p>
            </div>
            <div className="ds-foot" style={{ color: 'var(--muted)' }}><span>DM Beauty Parlour · Design Document</span><span>05 · Dark mode</span></div>
          </section>

          {/* Dark tokens reference */}
          <section className="ds-page on-dark">
            <div className="ds-head-row">
              <span className="ds-secno" style={{ color: 'var(--gold)' }}>05·a</span>
              <h2 className="ds-h" style={{ color: 'var(--ink)' }}>Dark tokens</h2>
              <span className="meta" style={{ color: 'var(--muted)' }}>Inverted surfaces · brightened gold · same structure.</span>
            </div>

            <div className="ds-col-group">
              <div className="ds-col-title" style={{ color: 'var(--muted)' }}>Dark surface &amp; gold</div>
              <div className="ds-col-row">
                <div className="ds-swatch on-light" style={{ background: '#0f0d0a', borderColor: '#2a241c' }}><div className="nm" style={{ color: '#f1e7d4' }}>bg</div><div className="hx" style={{ color: '#918471' }}>#0F0D0A</div></div>
                <div className="ds-swatch on-light" style={{ background: '#181410' }}><div className="nm" style={{ color: '#f1e7d4' }}>bg / soft</div><div className="hx" style={{ color: '#918471' }}>#181410</div></div>
                <div className="ds-swatch on-light" style={{ background: '#221c14' }}><div className="nm" style={{ color: '#f1e7d4' }}>bg / cream</div><div className="hx" style={{ color: '#918471' }}>#221C14</div></div>
                <div className="ds-swatch on-dark" style={{ background: '#d4a875' }}><div className="nm">gold</div><div className="hx">#D4A875</div></div>
                <div className="ds-swatch on-dark" style={{ background: '#c8965d' }}><div className="nm">gold / deep</div><div className="hx">#C8965D</div></div>
                <div className="ds-swatch on-light" style={{ background: '#f1e7d4' }}><div className="nm">ink</div><div className="hx">#F1E7D4</div></div>
              </div>
            </div>

            <div className="ds-col-group">
              <div className="ds-col-title" style={{ color: 'var(--muted)' }}>Dark lines, text &amp; status</div>
              <div className="ds-col-row">
                <div className="ds-swatch on-light" style={{ background: '#2a241c' }}><div className="nm" style={{ color: '#f1e7d4' }}>line</div><div className="hx" style={{ color: '#918471' }}>#2A241C</div></div>
                <div className="ds-swatch on-light" style={{ background: '#3b3225' }}><div className="nm" style={{ color: '#f1e7d4' }}>line / 2</div><div className="hx" style={{ color: '#918471' }}>#3B3225</div></div>
                <div className="ds-swatch on-light" style={{ background: '#918471' }}><div className="nm" style={{ color: '#f1e7d4' }}>muted</div><div className="hx" style={{ color: '#1a1a1a' }}>#918471</div></div>
                <div className="ds-swatch on-dark" style={{ background: '#88b894' }}><div className="nm">success</div><div className="hx">#88B894</div></div>
                <div className="ds-swatch on-dark" style={{ background: '#e0a874' }}><div className="nm">warn</div><div className="hx">#E0A874</div></div>
                <div className="ds-swatch on-dark" style={{ background: '#e0807a' }}><div className="nm">danger</div><div className="hx">#E0807A</div></div>
              </div>
            </div>

            <div className="ds-grid-2" style={{ marginTop: 8 }}>
              <div className="ds-comp">
                <h4>Buttons · dark</h4>
                <div className="ds-row">
                  <span className="btn btn-primary" style={{ background: 'var(--ink)', color: 'var(--bg)', borderColor: 'var(--ink)' }}>Book Now</span>
                  <span className="btn btn-ghost" style={{ color: 'var(--ink)', borderColor: 'var(--line-2)' }}>Explore</span>
                  <span className="btn btn-gold">Bridal</span>
                </div>
              </div>
              <div className="ds-comp">
                <h4>Chips &amp; status · dark</h4>
                <div className="ds-row">
                  <span className="ds-chip active" style={{ background: 'var(--gold)', color: 'var(--bg)', borderColor: 'var(--gold)' }}>All</span>
                  <span className="ds-chip" style={{ borderColor: 'var(--line-2)', color: 'var(--ink-2)' }}>Hair</span>
                  <span className="ds-pill ok" style={{ background: 'rgba(136,184,148,0.15)', color: 'var(--success)' }}>Confirmed</span>
                  <span className="ds-pill pend" style={{ background: 'rgba(224,168,116,0.15)', color: 'var(--warn)' }}>Pending</span>
                </div>
              </div>
            </div>

            <div className="ds-foot" style={{ color: 'var(--muted)' }}><span>DM Beauty Parlour · Design Document</span><span>05·a · Dark tokens</span></div>
          </section>
        </div>

      </div>
    </div>
  );
}
