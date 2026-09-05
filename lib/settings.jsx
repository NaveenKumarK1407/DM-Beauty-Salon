'use client';
import React from 'react';
import { cachedFetchJson, invalidateCached } from './clientCache';

const DEFAULT_SETTINGS = {
  name: 'DM Beauty Parlour',
  phone: '+91 98765 43210',
  email: 'dmbeauty.medak@gmail.com',
  currency: 'INR · ₹',
  address: '2nd Floor, Above Pochamma Maidan, Medak 502110',
  openDays: 'Mon - Sat',
  hoursText: 'Mon - Sat · 10 am - 8 pm, Sun · Closed',
  openTime: '10:00',
  closeTime: '20:00',
  closedDays: ['Sunday'],
  instagram: '',
  facebook: '',
};

const SettingsContext = React.createContext(null);

export function SettingsProvider({ children, initialSettings = null }) {
  // When the server layout already fetched settings, start from those and
  // skip the client-side /api/settings call entirely.
  const [settings, setSettings] = React.useState(initialSettings || DEFAULT_SETTINGS);
  const [loading, setLoading] = React.useState(!initialSettings);

  const fetchSettings = React.useCallback(async ({ fresh = false } = {}) => {
    try {
      if (fresh) invalidateCached('/api/settings');
      const data = await cachedFetchJson('/api/settings');
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch studio settings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const hasInitial = !!initialSettings;
  React.useEffect(() => {
    if (hasInitial) return; // server-rendered settings are already current
    fetchSettings();
  }, [fetchSettings, hasInitial]);

  const updateSettings = React.useCallback(async (newSettings) => {
    // Optimistic update — site-wide hours/footer/contact refresh immediately
    setSettings(newSettings);
    invalidateCached('/api/settings');
    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    if (!res.ok) {
      await fetchSettings({ fresh: true });
      throw new Error('Failed to save settings');
    }
    const data = await res.json();
    if (data.settings) setSettings(data.settings);
    else await fetchSettings({ fresh: true });
  }, [fetchSettings]);

  const reloadSettings = React.useCallback(() => fetchSettings({ fresh: true }), [fetchSettings]);

  const value = React.useMemo(() => ({ settings, loading, reloadSettings, updateSettings }), [settings, loading, reloadSettings, updateSettings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return ctx;
}
