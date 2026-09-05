'use client';
// Contact page — info panel + enquiry form that POSTs to /api/contact.
import React from 'react';
import { MapEmbed } from './MapMockup';
import { IconArrow, IconMap, IconPhone, IconWa, IconMail, IconClock, IconCheck } from '@/lib/data';
import { Socials } from './Socials';
import { useSettings } from '@/lib/settings';
import { getCityFromAddress } from '@/lib/utils';
import { VisitHoursBlock } from './HoursText';

export function ContactView() {
  const [sent, setSent] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [studioWhatsApp, setStudioWhatsApp] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', email: '', service: 'General enquiry', message: '' });
  const { settings } = useSettings();
  const city = settings?.address ? getCityFromAddress(settings.address) : 'Medak';
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not send message');
      setStudioWhatsApp(json.studioWhatsApp || null);
      setSent(true);
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fade-in">
      <style>{`
        .contact-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 40px; align-items: start; }
        @media(max-width:768px) { .contact-grid { grid-template-columns: 1fr; gap: 24px; } }
      `}</style>
      <section className="section" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <div className="container">
          <div className="contact-grid">
            <div>
              <div className="section-head left" style={{ marginBottom: 24, gap: 8 }}>
                <span className="eyebrow">Get in Touch</span>
                <h2 style={{ fontSize: 'clamp(28px, 3vw, 44px)' }}>Come visit us, <span className="italic">or just call.</span></h2>
                <p style={{ fontSize: 14, margin: 0 }}>We answer DMs and WhatsApps within an hour during studio hours. For bridal enquiries, please use the form below so we can prepare your consultation.</p>
              </div>
            <div className="contact-info" style={{ gap: 22 }}>
              {/* Address, reservations & hours live in the visit card below — only
                  the channels unique to this page are listed here. */}
              <div className="info-row">
                <div className="info-icon"><IconWa /></div>
                <div>
                  <h4>WhatsApp</h4>
                  <div className="val val-tel">{settings.phone}</div>
                  <div className="sub">For quick reschedules and bridal references</div>
                </div>
              </div>
              <div className="info-row">
                <div className="info-icon"><IconMail /></div>
                <div>
                  <h4>Email</h4>
                  <div className="val val-tel"><a href={`mailto:${settings.email}`}>{settings.email}</a></div>
                  <div className="sub">dmbeauty.medak@gmail.com · for wedding enquiries</div>
                </div>
              </div>

              <div style={{ paddingTop: 6 }}>
                <Socials size={42} />
              </div>
            </div>
            </div>

            <div className="contact-form">
              {!sent ? (
                <form onSubmit={submit}>
                  <h3 style={{ marginBottom: 6 }}>Send a note</h3>
                  <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>We typically reply within a few hours.</p>
                  <div className="field-row">
                    <div className="field">
                      <label>Your name</label>
                      <input type="text" required value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Full name" />
                    </div>
                    <div className="field">
                      <label>Email or phone</label>
                      <input type="text" required value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@email.com" />
                    </div>
                  </div>
                  <div className="field">
                    <label>What&apos;s this about?</label>
                    <select value={form.service} onChange={(e) => update('service', e.target.value)}>
                      <option>General enquiry</option>
                      <option>Bridal consultation</option>
                      <option>Reschedule appointment</option>
                      <option>Group / party booking</option>
                      <option>Partnerships</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Message</label>
                    <textarea required value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="Tell us about your wedding, occasion, or what's on your mind..." />
                  </div>
                  {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16 }}>{error}</p>}
                  <button type="submit" className="btn btn-primary" disabled={busy} style={{ width: '100%', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}>
                    {busy ? 'Sending…' : 'Send Message'} <IconArrow size={12} />
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="check" style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gold)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <IconCheck size={24} />
                  </div>
                  <h3>Message received.</h3>
                  <p style={{ color: 'var(--muted)', marginTop: 8 }}>We&apos;ll get back to you within a few hours. For a faster reply, message us on WhatsApp.</p>
                  {studioWhatsApp && (
                    <a className="btn btn-primary" href={studioWhatsApp} target="_blank" rel="noopener noreferrer" style={{ marginTop: 20, display: 'inline-flex' }}>
                      <IconWa /> &nbsp; Message on WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 var(--section) 0' }}>
        <div className="container">
          {/* Visit card — info panel left, UI map right (stacks on mobile) */}
          <div className="visit-card">
            <div className="visit-card-info">
              <span className="eyebrow">Visit Us</span>
              <h2 style={{ fontSize: 'clamp(22px, 2.1vw, 32px)' }}>Visit our Salon, <span className="italic">in {city}.</span></h2>
              <p style={{ color: 'var(--muted)', fontSize: 13, margin: 0 }}>Drop in any time, or call ahead for the chair you want. Free parking in the lane behind the building.</p>
              <div className="info-row visit-row">
                <div className="info-icon"><IconMap /></div>
                <div><h4>Address</h4><div className="val" style={{ fontSize: 14, lineHeight: 1.4 }}>{settings.address}</div></div>
              </div>
              <div className="info-row visit-row">
                <div className="info-icon"><IconPhone /></div>
                <div><h4>Reservations</h4><div className="visit-phone"><a href={`tel:${(settings.phone || '').replace(/\s/g, '')}`}>{settings.phone}</a></div></div>
              </div>
              <div className="info-row visit-row">
                <div className="info-icon"><IconClock /></div>
                <div>
                  <h4>Hours</h4>
                  <VisitHoursBlock settings={settings} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
                <a className="btn btn-primary" href="/booking">Book a Chair</a>
                <a className="btn btn-ghost desktop-only" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address || 'Medak Telangana')}`} target="_blank" rel="noopener noreferrer">Get Directions <IconArrow size={12} /></a>
              </div>
            </div>
            <div className="visit-card-map">
              <MapEmbed address={settings.address || 'Medak Telangana'} />
              {/* Whole map opens the location — sits under the place card */}
              <a className="map-click-overlay" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address || 'Medak Telangana')}`} target="_blank" rel="noopener noreferrer" aria-label="Open location in Google Maps" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
