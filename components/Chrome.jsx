'use client';
// Renders the site nav, footer and appearance panel around page content.
// Hidden on the admin dashboard and the print-style Design Document, which have
// their own full-screen / print-clean layouts.
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppearanceProvider } from '@/lib/appearance';
import { SettingsProvider } from '@/lib/settings';
import { TopNav, Footer } from './Nav';

export function SiteChrome({ children, initialSettings = null }) {
  const pathname = usePathname();
  const isDesign = pathname?.startsWith('/design');
  const bare = pathname?.startsWith('/admin') || isDesign;

  // Gracefully hide broken images (Unsplash photos occasionally 404).
  useEffect(() => {
    const handler = (e) => {
      const el = e.target;
      if (el && el.tagName === 'IMG') {
        el.style.visibility = 'hidden';
        if (el.parentElement) el.parentElement.style.background = 'var(--bg-cream)';
      }
    };
    document.addEventListener('error', handler, true);
    return () => document.removeEventListener('error', handler, true);
  }, []);

  return (
    <SettingsProvider initialSettings={initialSettings}>
      <AppearanceProvider>
        {!bare && <TopNav />}
        <main>{children}</main>
        {!bare && <Footer />}
      </AppearanceProvider>
    </SettingsProvider>
  );
}
