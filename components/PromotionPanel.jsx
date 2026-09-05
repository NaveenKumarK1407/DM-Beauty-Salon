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

export function PromotionPanel({ user }) {
  const [form, setForm] = React.useState({ title: '', image: '', enabled: false });
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');
  const [preview, setPreview] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/api/promotion', { cache: 'no-store' }).then(async res => {
      if (!res.ok) throw new Error('Could not load the popup. Reopen this section to try again.');
      const data = await res.json();
      if (!cancelled && data.promotion) setForm(data.promotion);
    }).catch(err => { if (!cancelled) { setError(err.message); setLoadError(true); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const image = await prepareImage(file);
      setForm(current => ({ ...current, image }));
    } catch (err) { setError(err.message || 'Could not read this image.'); }
    finally { setBusy(false); }
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true); setError(''); setMessage('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/promotion', {
        method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: form.title, image: form.image, enabled: form.enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not save the popup.');
      setForm(data.promotion);
      setMessage(data.promotion.enabled ? 'Saved! Visitors will see this post when they open the homepage.' : 'Saved. The homepage popup is turned off.');
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  if (loading) return <div className="panel">Loading homepage popup...</div>;
  return <section className="panel" style={{ padding: 24, maxWidth: 760 }}>
    <h2 style={{ marginBottom: 8 }}>Homepage Popup</h2>
    <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Share a Christmas greeting, festival poster, or special offer. Your post appears each time a visitor opens the homepage and disappears after 5 seconds. They can also close it immediately.</p>
    <form onSubmit={save}>
      <fieldset disabled={busy || loadError} style={{ border: 0, padding: 0, margin: 0, display: 'grid', gap: 20, minWidth: 0 }}>
        <div className="field"><label htmlFor="promotion-title">Image description (optional)</label>
          <input id="promotion-title" value={form.title} maxLength={160} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Merry Christmas! 20% off all facials" style={{ width: '100%' }} />
        </div>
        <div className="field"><label htmlFor="promotion-image">Upload your post</label>
          <input id="promotion-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} style={{ width: '100%' }} />
          <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>JPG, PNG, or WebP, up to 20 MB. Your full image will be shown without cropping.</p>
        </div>
        {form.image && <div style={{ background: 'var(--bg-soft)', borderRadius: 10, padding: 12 }}>
          <img src={form.image} alt={form.title || 'Popup preview'} style={{ display: 'block', width: '100%', maxHeight: 360, objectFit: 'contain' }} />
        </div>}
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} /> Show popup on the homepage
        </label>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" type="submit" disabled={form.enabled && !form.image}>{busy ? 'Saving...' : 'Save Popup'}</button>
          <button className="btn btn-ghost" type="button" disabled={!form.image} onClick={() => setPreview(true)}>Preview for 5 seconds</button>
          {form.image && <button className="btn btn-ghost" type="button" onClick={() => setForm({ title: '', image: '', enabled: false })}>Remove image</button>}
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted)' }}>Changes appear on your website after you save. Turn the popup off when your promotion ends.</p>
      </fieldset>
      {error && <p role="alert" style={{ marginTop: 16, color: 'var(--danger, #b42318)' }}>{error}</p>}
      {message && <p role="status" style={{ marginTop: 16 }}>{message}</p>}
    </form>
    {preview && <HomepagePopup promotion={{ ...form, enabled: true }} onDismiss={() => setPreview(false)} />}
  </section>;
}
