import { AdminPwaSetup } from '@/components/AdminPwaSetup';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'DM Beauty studio admin — bookings, customers, walk-ins and settings.',
  manifest: '/api/admin-manifest',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'DM Admin',
    statusBarStyle: 'black-translucent',
  },
};

export default function AdminLayout({ children }) {
  return (
    <>
      <AdminPwaSetup />
      {children}
    </>
  );
}
