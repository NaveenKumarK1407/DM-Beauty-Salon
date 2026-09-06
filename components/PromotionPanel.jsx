'use client';

import React from 'react';
import { HomepagePopup } from './HomepagePopup';

async function prepareImage(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG, or WebP image.');
  if (file.size > 20 * 1024 * 1024) throw new Error('Please choose an image under 20 MB.');
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.9, 0.8, 0.7, 0.6]) {
      const result = canvas.toDataURL('image/jpeg', quality);
      if (result.length < 700000) return result;
    }
    throw new Error('This image is too detailed. Please upload a smaller version.');
  } finally { URL.revokeObjectURL(url); }
}

// <input type="datetime-local"> speaks local wall-clock time with no zone, so
// convert on the way in and out rather than storing the raw field value.
function toLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
const fromLocalInput = (value) => (value ? new Date(value).toISOString() : null);

const formatWhen = (iso) => (iso
  ? new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })
  : null);

// Quick presets so the common cases ("run it now", "start tomorrow morning")
// take one click, with the full picker kept for anything else.
const startOfDay = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(0, 0, 0, 0);
  return d;
};
const endOfDay = (offsetDays = 0) => {
  const d = startOfDay(offsetDays);
  d.setHours(23, 59, 0, 0);
  return d;
};
const sameLocalDay = (localValue, date) => localValue === toLocalInput(date.toISOString());

// Which preset a stored value corresponds to, so reopening an existing banner
// shows the right option rather than defaulting back to Today.
function presetFor(localValue, kind) {
  if (!localValue) return kind === 'start' ? 'now' : 'none';
  const pick = kind === 'start' ? startOfDay : endOfDay;
  if (sameLocalDay(localValue, pick(0))) return 'today';
  if (sameLocalDay(localValue, pick(1))) return 'tomorrow';
  return 'custom';
}

const STATUS_STYLE = {
  live: { label: 'Live', color: 'var(--success)' },
  scheduled: { label: 'Scheduled', color: 'var(--warn)' },
  paused: { label: 'Paused', color: 'var(--muted)' },
  expired: { label: 'Ended', color: 'var(--muted)' },
};

// A function, not a constant: "today" has to be resolved when the form opens,
// otherwise a dashboard left open overnight would still offer yesterday.
const blankBanner = () => ({
  id: null,
  title: '',
  image: '',
  enabled: true,
  startAt: toLocalInput(startOfDay(0).toISOString()),
  endAt: toLocalInput(endOfDay(0).toISOString()),
});

// Dropdown of common choices; "Pick a date…" swaps in the full picker and
// opens it, so the calendar is one click away without always being on screen.
function ScheduleField({ id, label, kind, value, onChange, min, hint }) {
  const [mode, setMode] = React.useState(() => presetFor(value, kind));
  const picker = React.useRef(null);
  const pick = kind === 'start' ? startOfDay : endOfDay;

  // Follow the value when it is changed from outside (e.g. opening a banner
  // for editing), but never fight the admin while they are choosing a date.
  React.useEffect(() => { setMode((m) => (m === 'custom' ? m : presetFor(value, kind))); }, [value, kind]);

  const choose = (next) => {
    setMode(next);
    if (next === 'today') onChange(toLocalInput(pick(0).toISOString()));
    else if (next === 'tomorrow') onChange(toLocalInput(pick(1).toISOString()));
    else if (next === 'now' || next === 'none') onChange('');
    else if (next === 'custom') {
      if (!value) onChange(toLocalInput(pick(0).toISOString()));
      // showPicker() needs a user gesture; this runs inside the change event.
      requestAnimationFrame(() => { try { picker.current?.showPicker?.(); } catch { picker.current?.focus(); } });
    }
  };

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={mode} onChange={(e) => choose(e.target.value)} style={{ width: '100%' }}>
        {kind === 'start'
          ? <option value="now">As soon as I save</option>
          : <option value="none">No end date</option>}
        <option value="today">Today</option>
        <option value="tomorrow">Tomorrow</option>
        <option value="custom">Pick a date…</option>
      </select>
      {mode === 'custom' && (
        <input ref={picker} type="datetime-local" aria-label={`${label} — exact date and time`}
          value={value} min={min} onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', marginTop: 10 }} />
      )}
      <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
        {value ? formatWhen(fromLocalInput(value)) : hint}
      </p>
    </div>
  );
}

// Deleting is irreversible and the trigger is now a small icon, so the
// confirmation is a real modal rather than an extra pair of inline buttons.
function ConfirmDelete({ banner, busy, onCancel, onConfirm }) {
  const dialog = React.useRef(null);
  React.useEffect(() => { dialog.current?.showModal(); }, []);
  return (
    <dialog ref={dialog} onCancel={onCancel} onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
      aria-labelledby="promo-del-title"
      style={{ padding: 0, border: 'none', borderRadius: 14, background: 'var(--bg)', color: 'var(--ink)', width: 'min(420px, calc(100vw - 32px))', boxShadow: '0 24px 80px #0006' }}>
      <div style={{ padding: 24 }}>
        <h3 id="promo-del-title" style={{ margin: '0 0 10px', fontSize: 20 }}>Delete this popup?</h3>
        <p style={{ margin: '0 0 18px', color: 'var(--muted)', fontSize: 14, lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--ink)' }}>{banner.title || 'Untitled popup'}</strong> will be removed
          permanently and will not show on the homepage again. This cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" type="button" onClick={onCancel} disabled={busy}>Keep it</button>
          <button className="btn btn-primary" type="button" onClick={onConfirm} disabled={busy} autoFocus>
            {busy ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
      <style>{'dialog::backdrop { background: rgba(0,0,0,.55); }'}</style>
    </dialog>
  );
}

const IconTrash = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
  </svg>
);

function StatusPill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.paused;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: s.color, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {s.label}
    </span>
  );
}

export function PromotionPanel({ user }) {
  const [banners, setBanners] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const [editing, setEditing] = React.useState(null); // null = list view
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [preview, setPreview] = React.useState(false);
  const [confirmId, setConfirmId] = React.useState(null);

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/promotion?list=1', { cache: 'no-store' });
      if (!res.ok) throw new Error('Could not load your popups. Reopen this section to try again.');
      const data = await res.json();
      setBanners(data.promotions || []);
      setLoadError(false);
    } catch (err) { setError(err.message); setLoadError(true); }
    finally { setLoading(false); }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const image = await prepareImage(file);
      setEditing((current) => ({ ...current, image }));
    } catch (err) { setError(err.message || 'Could not read this image.'); }
    finally { setBusy(false); }
  }

  async function save(event) {
    event?.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/promotion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...(editing.id ? { id: editing.id } : {}),
          title: editing.title,
          image: editing.image,
          enabled: editing.enabled,
          startAt: fromLocalInput(editing.startAt),
          endAt: fromLocalInput(editing.endAt),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the popup.');
      await load();
      setEditing(null);
      setPreview(false);
      setMessage(data.promotion.status === 'scheduled'
        ? `Saved. This popup starts ${formatWhen(data.promotion.startAt)}.`
        : data.promotion.status === 'live'
          ? 'Saved! Visitors will see this popup when they open the homepage.'
          : 'Saved. This popup is not showing right now.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function toggle(banner) {
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/promotion', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          id: banner.id, title: banner.title || '', image: banner.image,
          enabled: !banner.enabled, startAt: banner.startAt || null, endAt: banner.endAt || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update the popup.');
      await load();
      setMessage(banner.enabled ? 'Popup paused.' : 'Popup turned back on.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  async function remove(banner) {
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/promotion?id=${encodeURIComponent(banner.id)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not delete the popup.');
      await load();
      setConfirmId(null);
      setMessage('Popup deleted. It will not show on the homepage again.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  // Resolved from the list, so a banner deleted elsewhere closes the dialog.
  const confirmBanner = banners.find((b) => b.id === confirmId) || null;

  if (loading) return <div className="panel">Loading homepage popups...</div>;

  // ── Editor ────────────────────────────────────────────────
  if (editing) {
    return (
      <section className="panel" style={{ padding: 24, maxWidth: 760 }}>
        <h2 style={{ marginBottom: 8 }}>{editing.id ? 'Edit Popup' : 'New Popup'}</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
          Share a festival poster, greeting or special offer. Choose when it starts and ends — you can set this up weeks ahead.
        </p>
        <form onSubmit={save}>
          <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 20, minWidth: 0 }}>
            <div className="field">
              <label htmlFor="promotion-title">Image description (optional)</label>
              <input id="promotion-title" value={editing.title} maxLength={160}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="e.g. Independence Day — 20% off all facials" style={{ width: '100%' }} />
            </div>

            <div className="field">
              <label htmlFor="promotion-image">{editing.image ? 'Replace image' : 'Upload your post'}</label>
              <input id="promotion-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} style={{ width: '100%' }} />
              <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>JPG, PNG, or WebP, up to 20 MB. Your full image is shown without cropping.</p>
            </div>

            {editing.image && (
              <div style={{ background: 'var(--bg-soft)', borderRadius: 10, padding: 12 }}>
                <img src={editing.image} alt={editing.title || 'Popup preview'} style={{ display: 'block', width: '100%', maxHeight: 360, objectFit: 'contain' }} />
              </div>
            )}

            <div className="field-row" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <ScheduleField id="promotion-start" label="Start showing" kind="start"
                value={editing.startAt} hint="Starts as soon as you save"
                onChange={(startAt) => setEditing((c) => ({ ...c, startAt }))} />
              <ScheduleField id="promotion-end" label="Stop showing" kind="end"
                value={editing.endAt} min={editing.startAt || undefined}
                hint="Keeps running until you pause it"
                onChange={(endAt) => setEditing((c) => ({ ...c, endAt }))} />
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={editing.enabled}
                onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} />
              Turn this popup on
            </label>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" type="submit" disabled={!editing.image}>{busy ? 'Saving...' : 'Save Popup'}</button>
              <button className="btn btn-ghost" type="button" disabled={!editing.image} onClick={() => setPreview(true)}>Preview for 5 seconds</button>
              <button className="btn btn-ghost" type="button" onClick={() => { setEditing(null); setError(''); setMessage(''); }}>Cancel</button>
            </div>
          </fieldset>
          {error && <p role="alert" style={{ marginTop: 16, color: 'var(--danger, #b42318)' }}>{error}</p>}
        </form>
        {preview && <HomepagePopup promotion={{ ...editing, enabled: true, endAt: null }} onDismiss={() => setPreview(false)} />}
      </section>
    );
  }

  // ── List ──────────────────────────────────────────────────
  return (
    <section className="panel" style={{ padding: 24, maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <h2 style={{ marginBottom: 8 }}>Homepage Popup</h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>
            Posters shown to visitors when they open the homepage. Each one closes after 5 seconds, or when the visitor closes it.
          </p>
        </div>
        <button className="btn btn-primary" type="button" disabled={loadError} onClick={() => { setEditing(blankBanner()); setError(''); setMessage(''); }}>
          + Create New
        </button>
      </div>

      {message && <p role="status" style={{ marginTop: 16 }}>{message}</p>}
      {error && <p role="alert" style={{ marginTop: 16, color: 'var(--danger, #b42318)' }}>{error}</p>}

      {banners.length === 0 ? (
        <div style={{ marginTop: 24, padding: '40px 24px', textAlign: 'center', background: 'var(--bg-soft)', borderRadius: 12, border: '1px dashed var(--line)' }}>
          <p style={{ margin: 0, color: 'var(--muted)' }}>No popups yet. Create one to greet visitors with a festival poster or offer.</p>
        </div>
      ) : (
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          {banners.map((banner) => (
            <article key={banner.id} className="promo-card">
              {/* contain, not cover: the poster is the whole point, so show all
                  of it rather than a centre crop. */}
              <img className="promo-card-thumb" src={banner.image} alt="" />
              <div className="promo-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 15 }}>{banner.title || 'Untitled popup'}</strong>
                  <StatusPill status={banner.status} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  {banner.startAt ? `From ${formatWhen(banner.startAt)}` : 'From when it was saved'}
                  {banner.endAt ? ` · until ${formatWhen(banner.endAt)}` : ' · no end date'}
                </div>
                <div className="promo-card-actions">
                  <button className="promo-act" type="button" disabled={busy}
                    onClick={() => { setEditing({ ...banner, title: banner.title || '', startAt: toLocalInput(banner.startAt), endAt: toLocalInput(banner.endAt) }); setError(''); setMessage(''); }}>
                    Edit
                  </button>
                  <button className="promo-act" type="button" disabled={busy} onClick={() => toggle(banner)}>
                    {banner.enabled ? 'Pause' : 'Turn on'}
                  </button>
                  <button className="promo-act promo-act-danger" type="button" disabled={busy}
                    onClick={() => setConfirmId(banner.id)}
                    aria-label={`Delete ${banner.title || 'this popup'}`} title="Delete">
                    <IconTrash />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {confirmBanner && (
        <ConfirmDelete banner={confirmBanner} busy={busy}
          onCancel={() => setConfirmId(null)} onConfirm={() => remove(confirmBanner)} />
      )}
    </section>
  );
}
