'use client';
// Shared appearance state (theme / palette / display font / density).
// One source of truth so the navbar light/dark toggle and the settings panel
// stay in sync. Applies tokens to <html> and persists to localStorage.
import React from 'react';

const TWEAK_DEFAULTS = { palette: 'champagne', headingFont: 'cormorant', density: 'default', theme: 'dark' };
const STORAGE_KEY = 'dmbeauty.appearance';

const AppearanceContext = React.createContext(null);

function applyToHtml(t) {
  const r = document.documentElement;
  if (t.palette && t.palette !== 'champagne') r.setAttribute('data-palette', t.palette); else r.removeAttribute('data-palette');
  if (t.headingFont && t.headingFont !== 'cormorant') r.setAttribute('data-headingfont', t.headingFont); else r.removeAttribute('data-headingfont');
  if (t.density && t.density !== 'default') r.setAttribute('data-density', t.density); else r.removeAttribute('data-density');
  if (t.theme === 'dark') r.setAttribute('data-theme', 'dark'); else r.removeAttribute('data-theme');
}

export function AppearanceProvider({ children }) {
  const [tweaks, setTweaks] = React.useState(TWEAK_DEFAULTS);
  const [hydrated, setHydrated] = React.useState(false);

  // hydrate from localStorage after mount (avoids SSR mismatch)
  React.useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        setTweaks((t) => ({ ...t, ...saved }));
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  // apply + persist whenever tweaks change
  React.useEffect(() => {
    applyToHtml(tweaks);
    if (hydrated) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tweaks)); } catch { /* ignore */ }
    }
  }, [tweaks, hydrated]);

  const setTweak = React.useCallback((key, value) => {
    setTweaks((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTweaks((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);

  const value = React.useMemo(() => ({ tweaks, setTweak, toggleTheme }), [tweaks, setTweak, toggleTheme]);
  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const ctx = React.useContext(AppearanceContext);
  if (!ctx) throw new Error('useAppearance must be used within AppearanceProvider');
  return ctx;
}
