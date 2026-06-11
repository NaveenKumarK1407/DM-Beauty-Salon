'use client';
// Live appearance controls (theme / palette / display font / density) + jump-to
// shortcuts. Holds its own tweak state, persists to localStorage, and applies
// the chosen tokens to <html>. Navigation uses the Next.js router.
import React from 'react';
import { useRouter } from 'next/navigation';
import { IconSettings } from '@/lib/data';
import { useAppearance } from '@/lib/appearance';

function Section({ label, children }) {
  return <><div className="set-sect">{label}</div>{children}</>;
}

function Segmented({ label, value, options, onChange }) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const n = options.length;
  return (
    <div className="set-row">
      <div className="set-lbl">{label}</div>
      <div className="set-seg" role="radiogroup">
        <div className="set-seg-thumb" style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`, width: `calc((100% - 4px) / ${n})` }} />
        {options.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function Select({ label, value, options, onChange }) {
  return (
    <div className="set-row">
      <div className="set-lbl">{label}</div>
      <select className="set-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

export function SettingsPanel() {
  const router = useRouter();
  const { tweaks, setTweak } = useAppearance();
  const [open, setOpen] = React.useState(false);

  if (!open) {
    return (
      <button className="set-fab" aria-label="Appearance settings" onClick={() => setOpen(true)}><IconSettings /></button>
    );
  }

  return (
    <>
      <div className="set-panel">
        <div className="set-hd">
          <b>Appearance</b>
          <button className="set-x" aria-label="Close" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="set-body">
          <Section label="Theme">
            <Segmented label="Mode" value={tweaks.theme}
              options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
              onChange={(v) => setTweak('theme', v)} />
          </Section>
          <Section label="Palette">
            <Select label="Color theme" value={tweaks.palette}
              options={[
                { value: 'champagne', label: 'Champagne · Editorial' },
                { value: 'rose', label: 'Rose · Soft Romantic' },
                { value: 'lavender', label: 'Lavender · Dreamy' },
                { value: 'charcoal', label: 'Sand · Warm Neutral' },
              ]}
              onChange={(v) => setTweak('palette', v)} />
          </Section>
          <Section label="Typography">
            <Select label="Display font" value={tweaks.headingFont}
              options={[
                { value: 'cormorant', label: 'Cormorant Garamond' },
                { value: 'italiana', label: 'Italiana' },
                { value: 'playfair', label: 'Playfair Display' },
                { value: 'dm-serif', label: 'DM Serif Display' },
              ]}
              onChange={(v) => setTweak('headingFont', v)} />
          </Section>
          <Section label="Layout">
            <Segmented label="Density" value={tweaks.density}
              options={[{ value: 'compact', label: 'Compact' }, { value: 'default', label: 'Regular' }, { value: 'airy', label: 'Airy' }]}
              onChange={(v) => setTweak('density', v)} />
          </Section>
          <Section label="Navigate">
            <button className="set-btn" onClick={() => { router.push('/admin'); setOpen(false); }}>→ View Admin Dashboard</button>
            <button className="set-btn secondary" onClick={() => { router.push('/booking'); setOpen(false); }}>→ View Booking Flow</button>
          </Section>
        </div>
      </div>
    </>
  );
}
