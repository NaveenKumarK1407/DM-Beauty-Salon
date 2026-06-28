'use client';
// On /admin, point the PWA manifest at the admin manifest so "Install app"
// opens the dashboard (/admin), not the public homepage (/).
import { useEffect } from 'react';

const ADMIN_MANIFEST = '/api/admin-manifest';

export function AdminPwaSetup() {
  useEffect(() => {
    const links = document.querySelectorAll('link[rel="manifest"]');
    if (links.length === 0) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = ADMIN_MANIFEST;
      document.head.appendChild(link);
      return;
    }
    links.forEach((link) => {
      link.href = ADMIN_MANIFEST;
    });
  }, []);
  return null;
}
