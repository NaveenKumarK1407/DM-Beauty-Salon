'use client';
// Booking flow — 4 steps: service, date+time, details, confirm.
// On reaching the confirm step the booking is POSTed to /api/bookings, which
// persists it and pushes a Firebase notification to the studio.
import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SERVICES, SVC_CATEGORIES, IconArrow, IconArrowLeft, IconCheck, IconWa, ICON_MAP, IconPackage } from '@/lib/data';
import { useSettings } from '@/lib/settings';
import { cachedFetchJson } from '@/lib/clientCache';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:30', '15:30', '16:30', '17:30', '18:30'];

export function BookingFlow() {
  const router = useRouter();
  const { settings } = useSettings();
  const params = useSearchParams();
  const prefilledService = params.get('service');

  const [step, setStep] = React.useState(prefilledService ? 1 : 0);
  const [data, setData] = React.useState({
    serviceId: prefilledService || null,
    date: null,
    slot: null,
    name: '', phone: '', email: '', notes: '',
  });

  // submission state
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState(null); // { reference } on success
  const [error, setError] = React.useState(null);

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

  const svc = services.find((s) => s.id === data.serviceId);
  const update = (patch) => setData((d) => ({ ...d, ...patch }));

  const canAdvance = [
    !!data.serviceId,
    !!data.date && !!data.slot,
    !!data.name && !!data.phone,
    true,
  ][step];

  async function submitBooking() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: data.serviceId,
          serviceName: svc?.name,
          price: svc?.price ?? null,
          date: data.date ? data.date.toDateString() : null,
          slot: data.slot,
          name: data.name,
          phone: data.phone,
          email: data.email || null,
          notes: data.notes || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not save booking');
      setResult(json);
    } catch (e) {
      setError(e.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  const goToConfirm = async () => {
    await submitBooking();
    setStep(3);
  };

  const resetAll = () => {
    setStep(0);
    setResult(null);
    setError(null);
    setData({ serviceId: null, date: null, slot: null, name: '', phone: '', email: '', notes: '' });
  };

  const steps = [
    { lbl: 'Service', val: svc ? svc.name : 'Choose service' },
    { lbl: 'Date & Time', val: data.date ? `${MONTHS[data.date.getMonth()].slice(0, 3)} ${data.date.getDate()}${data.slot ? ', ' + data.slot : ''}` : 'Select' },
    { lbl: 'Your Details', val: data.name || 'Contact info' },
    { lbl: 'Confirm', val: 'Review & book' },
  ];

  return (
    <div className="booking-shell fade-in">
      <div className="container" style={{ maxWidth: 1080, padding: '0 var(--gutter)' }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span className="eyebrow">Reserve a Chair</span>
          <h2 style={{ marginTop: 4, fontSize: 'clamp(24px, 2.4vw, 34px)' }}>Book your appointment</h2>
        </div>

        <div className="booking-card">
          <div className="stepper">
            {steps.map((s, i) => (
              <div key={i} className={'step ' + (i === step ? 'active ' : '') + (i < step ? 'done' : '')} onClick={() => i < step && !result && setStep(i)}>
                <div className="n">{i < step ? '✓' : i + 1}</div>
                <div>
                  <div className="lbl">{s.lbl}</div>
                  <div className="val">{s.val}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="booking-body">
            {step === 0 && <StepService data={data} update={update} services={services} loading={loading} />}
            {step === 1 && <StepDate data={data} update={update} />}
            {step === 2 && <StepDetails data={data} update={update} svc={svc} />}
            {step === 3 && <StepConfirm data={data} svc={svc} result={result} error={error} submitting={submitting} onHome={() => router.push('/')} onAnother={resetAll} onRetry={goToConfirm} />}
          </div>

          {step < 3 && (
            <div className="booking-nav">
              <button className="btn btn-ghost" onClick={() => (step === 0 ? router.push('/') : setStep(step - 1))}>
                <IconArrowLeft size={12} /> {step === 0 ? 'Cancel' : 'Back'}
              </button>
              <button
                className="btn btn-primary"
                disabled={!canAdvance || submitting}
                style={{ opacity: canAdvance && !submitting ? 1 : 0.4, pointerEvents: canAdvance && !submitting ? 'auto' : 'none' }}
                onClick={() => (step === 2 ? goToConfirm() : setStep(step + 1))}>
                {step === 2 ? (submitting ? 'Booking…' : 'Review Booking') : 'Continue'} <IconArrow size={12} />
              </button>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginTop: 16 }}>
          Need help? Call us at <strong style={{ color: 'var(--ink)' }}>{settings.phone}</strong> · WhatsApp anytime
        </p>
      </div>
    </div>
  );
}

function StepService({ data, update, services, loading }) {
  const [cat, setCat] = React.useState('All');

  const publicServices = React.useMemo(() => {
    return services.filter((s) => s.available !== false);
  }, [services]);

  const categories = React.useMemo(() => {
    const cats = new Set(['All']);
    publicServices.forEach((s) => {
      if (s.cat) cats.add(s.cat);
    });
    return Array.from(cats);
  }, [publicServices]);

  const list = cat === 'All' ? publicServices : publicServices.filter((s) => s.cat === cat);
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 0.95; }
          100% { opacity: 0.5; }
        }
      `}</style>
      <h2>What can we do for you?</h2>
      <p className="lead">Pick a single service to get started — you can add more once we confirm. Bridal? Tap &quot;Bridal Signature&quot; for a free consultation.</p>
      <div className="chip-row" style={{ justifyContent: 'flex-start', marginBottom: 14 }}>
        {categories.map((c) => (
          <span key={c} className={'chip ' + (cat === c ? 'active' : '')} onClick={() => setCat(c)}>{c}</span>
        ))}
      </div>
      <div className="svc-pick">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="opt" style={{ minHeight: '74px', border: '1px solid var(--line)', background: '#fcfaf7', animation: 'shimmer 1.5s infinite ease-in-out', display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 12, padding: 12, alignItems: 'center', width: '100%' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eae7e0' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ height: 16, background: '#eae7e0', borderRadius: 3, width: '60%' }} />
                  <div style={{ height: 12, background: '#eae7e0', borderRadius: 3, width: '40%' }} />
                </div>
              </div>
            </div>
          ))
        ) : (
          list.map((s) => {
          const Ic = ICON_MAP[s.icon] || ICON_MAP[s.cat] || IconPackage;
          const sel = data.serviceId === s.id;
          return (
            <div key={s.id} className={'opt ' + (sel ? 'sel' : '')} onClick={() => update({ serviceId: s.id })}>
              <div className="ic"><Ic /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4>{s.name}</h4>
                <div className="row2">
                  <span>{s.duration}</span>
                  <span>·</span>
                  <span>{s.price !== undefined && s.price !== null && s.price !== '' ? `₹${Number(s.price).toLocaleString('en-IN')}` : 'On request'}</span>
                </div>
              </div>
            </div>
          );
        }) )}
      </div>
    </>
  );
}

function StepDate({ data, update }) {
  const today = React.useMemo(() => { const t = new Date(); t.setHours(0, 0, 0, 0); return t; }, []);
  const [month, setMonth] = React.useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  const firstDow = month.getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

  const busy = (date, slot) => {
    if (!date) return false;
    const h = (date.getDate() + slot.charCodeAt(0)) % 7;
    return h < 2;
  };

  return (
    <>
      <h2>When works for you?</h2>
      <p className="lead">All sessions in IST. Mondays we&apos;re closed — sleeping, mostly.</p>
      <div className="cal-wrap">
        <div>
          <div className="cal-head">
            <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 11 }} onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>‹</button>
            <h4>{MONTHS[month.getMonth()]} {month.getFullYear()}</h4>
            <button className="btn btn-ghost" style={{ padding: '8px 14px', fontSize: 11 }} onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>›</button>
          </div>
          <div className="cal-grid">
            {DOW.map((d) => <div key={d} className="cal-dow">{d}</div>)}
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const isToday = d.getTime() === today.getTime();
              const isPast = d < today;
              const isMon = d.getDay() === 1;
              const sel = data.date && d.getTime() === data.date.getTime();
              return (
                <div key={i}
                  className={'cal-day ' + ((isPast || isMon) ? 'muted ' : '') + (sel ? 'sel ' : '') + (isToday ? 'today' : '')}
                  onClick={() => !isPast && !isMon && update({ date: d, slot: null })}>{d.getDate()}</div>
              );
            })}
          </div>
        </div>
        <div>
          <div style={{ marginBottom: 12 }}>
            <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>{data.date ? data.date.toDateString().split(' ').slice(0, 3).join(' ') : 'Pick a date'}</h4>
            <div style={{ color: 'var(--muted)', fontSize: 12, letterSpacing: '0.06em', marginTop: 4 }}>Available time slots</div>
          </div>
          {data.date ? (
            <div className="slot-grid">
              {SLOTS.map((t) => {
                const isBusy = busy(data.date, t);
                const sel = data.slot === t;
                return (
                  <div key={t}
                    className={'slot ' + (isBusy ? 'busy ' : '') + (sel ? 'sel' : '')}
                    onClick={() => !isBusy && update({ slot: t })}>{t}</div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: 14, padding: '40px 0', textAlign: 'center', border: '1px dashed var(--line-2)', borderRadius: 4 }}>
              Select a date to see times
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StepDetails({ data, update, svc }) {
  return (
    <>
      <h2>And your details?</h2>
      <p className="lead">We&apos;ll text the confirmation to your number. Promise: zero spam, just appointment reminders.</p>
      <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 28 }}>
        <div>
          <div className="field-row">
            <div className="field">
              <label>Full name</label>
              <input type="text" value={data.name} onChange={(e) => update({ name: e.target.value })} placeholder="e.g. Sravanthi Reddy" />
            </div>
            <div className="field">
              <label>Phone</label>
              <input type="tel" value={data.phone} onChange={(e) => update({ phone: e.target.value })} placeholder="+91 98765 43210" />
            </div>
          </div>
          <div className="field">
            <label>Email (optional)</label>
            <input type="email" value={data.email} onChange={(e) => update({ email: e.target.value })} placeholder="you@email.com" />
          </div>
          <div className="field">
            <label>Anything we should know?</label>
            <textarea value={data.notes} onChange={(e) => update({ notes: e.target.value })}
              placeholder="Allergies, reference photos, occasion, preferred stylist..." />
          </div>
        </div>
        <div className="summary">
          <h4>Your Booking</h4>
          {svc && (<>
            <div className="line"><span>Service</span><strong style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>{svc.name}</strong></div>
            <div className="line"><span>Duration</span><span>{svc.duration}</span></div>
            <div className="line"><span>Date</span><span>{data.date ? data.date.toDateString().split(' ').slice(0, 3).join(' ') : '—'}</span></div>
            <div className="line"><span>Time</span><span>{data.slot || '—'}</span></div>
            <div className="line total"><span>Total</span><span>{svc.price !== undefined && svc.price !== null && svc.price !== '' ? `₹${Number(svc.price).toLocaleString('en-IN')}` : 'On request'}</span></div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>No card needed — pay at the studio.</div>
          </>)}
        </div>
      </div>
    </>
  );
}

function StepConfirm({ data, svc, result, error, submitting, onHome, onAnother, onRetry }) {
  const { settings } = useSettings();
  if (submitting) {
    return <div className="confirm"><span className="eyebrow">One moment</span><h2 style={{ marginTop: 8 }}>Securing your chair…</h2></div>;
  }
  if (error) {
    return (
      <div className="confirm">
        <span className="eyebrow" style={{ color: 'var(--danger)' }}>Something went wrong</span>
        <h2 style={{ marginTop: 8 }}>We couldn&apos;t save that.</h2>
        <p style={{ color: 'var(--muted)', maxWidth: 460, margin: '16px auto 28px' }}>{error}. Please try again, or call us at {settings.phone}.</p>
        <button className="btn btn-primary" onClick={onRetry}>Try Again</button>
      </div>
    );
  }
  const ref = result?.reference || '—';
  // Pre-written WhatsApp message to the studio — the customer keeps a copy
  // of their booking in their own chat, and the studio receives it too.
  const waNumber = (settings.phone || '').replace(/[^\d]/g, '');
  const waText = encodeURIComponent(
    `Hi! I just booked an appointment at ${settings.name || 'DM Beauty Parlour'}.\n\n` +
    `Reference: ${ref}\n` +
    (svc ? `Service: ${svc.name}\n` : '') +
    (data.date ? `Date: ${data.date.toDateString()}\n` : '') +
    (data.slot ? `Time: ${data.slot}\n` : '') +
    (svc?.duration ? `Duration: ${svc.duration}\n` : '') +
    `Name: ${data.name}\n` +
    `Phone: ${data.phone}`
  );
  const waLink = `https://wa.me/${waNumber}?text=${waText}`;
  return (
    <div className="confirm">
      <div className="check"><IconCheck /></div>
      <span className="eyebrow">Booking Confirmed</span>
      <h2 style={{ marginTop: 8 }}>See you soon, {data.name.split(' ')[0] || 'there'}.</h2>
      <div className="ref">Reference · {ref}</div>
      {svc && data.date && (
        <div className="confirm-summary summary">
          <div className="line"><span>Service</span><strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{svc.name}</strong></div>
          <div className="line"><span>Date</span><span>{data.date.toDateString()}</span></div>
          <div className="line"><span>Time</span><span>{data.slot}</span></div>
          <div className="line"><span>Duration</span><span>{svc.duration}</span></div>
          <div className="line"><span>Stylist</span><span>Devi Madhuri</span></div>
          <div className="line total"><span>Total</span><span>{svc.price !== undefined && svc.price !== null && svc.price !== '' ? `₹${Number(svc.price).toLocaleString('en-IN')}` : 'On request'}</span></div>
        </div>
      )}
      <p style={{ color: 'var(--muted)', maxWidth: 480, margin: '32px auto', fontSize: 14 }}>
        Save your booking on WhatsApp below — it sends us your details and keeps a copy in your chat. If you need to reschedule, WhatsApp us at least 4 hours ahead.
      </p>
      <div className="confirm-actions" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {waNumber && (
          <a className="btn btn-primary" href={waLink} target="_blank" rel="noopener noreferrer">
            <IconWa /> &nbsp; Save on WhatsApp
          </a>
        )}
        <button className="btn btn-ghost" onClick={onHome}>Back to Home</button>
        <button className="btn btn-ghost" onClick={onAnother}>Book Another</button>
      </div>
    </div>
  );
}
