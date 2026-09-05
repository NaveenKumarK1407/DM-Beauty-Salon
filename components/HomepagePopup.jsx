'use client';

import React from 'react';
import { createPortal } from 'react-dom';

export function HomepagePopup({ promotion, onDismiss }) {
  const [loaded, setLoaded] = React.useState(false);
  const [dismissed, setDismissed] = React.useState(false);
  const dialog = React.useRef(null);
  const dismiss = React.useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [onDismiss]);
  const visible = loaded && !dismissed && promotion?.enabled && !!promotion.image;

  React.useEffect(() => {
    if (!promotion?.enabled || !promotion.image) return;
    let cancelled = false;
    const image = new Image();
    image.onload = () => { if (!cancelled) setLoaded(true); };
    image.src = promotion.image;
    return () => { cancelled = true; };
  }, [promotion?.enabled, promotion?.image]);

  React.useEffect(() => {
    if (!visible) return;
    const previousFocus = document.activeElement;
    dialog.current.showModal();
    const timer = setTimeout(dismiss, 5000);
    return () => {
      clearTimeout(timer);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [visible, dismiss]);

  if (!visible) return null;
  return createPortal(
    <dialog ref={dialog} aria-label={promotion.title || 'Studio announcement'} onCancel={dismiss}
      onClick={e => { if (e.target === e.currentTarget) dismiss(); }}
      style={{ padding: 0, border: 'none', borderRadius: 14, background: 'var(--bg, #fff)', color: 'var(--ink, #222)', width: 'min(520px, calc(100vw - 32px))', maxHeight: '90dvh', boxShadow: '0 24px 80px #0006' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 14px' }}>
        <span style={{ fontSize: 12 }}>Closes automatically after 5 seconds</span>
        <button type="button" autoFocus onClick={dismiss} aria-label="Close announcement" style={{ width: 44, height: 44, borderRadius: '50%', border: '1px solid var(--line, #ddd)', background: 'transparent', color: 'inherit', fontSize: 24, cursor: 'pointer' }}>&times;</button>
      </div>
      <img src={promotion.image} alt={promotion.title || 'Studio announcement'} onError={dismiss} style={{ display: 'block', width: '100%', maxHeight: 'calc(90dvh - 64px)', objectFit: 'contain' }} />
      <style>{`dialog::backdrop { background: rgba(0, 0, 0, .62); }`}</style>
    </dialog>, document.body
  );
}
