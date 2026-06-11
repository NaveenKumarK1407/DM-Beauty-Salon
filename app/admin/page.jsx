'use client';
// Admin page — shows login gate until Firebase Auth confirms a signed-in user,
// then renders the real-time dashboard.
import React from 'react';
import { AdminDashboard } from '@/components/AdminDashboard';
import { AdminLogin }     from '@/components/AdminLogin';
import { getClientAuth }  from '@/lib/firebaseClient';

export default function AdminPage() {
  const [user,    setUser]    = React.useState(undefined); // undefined = checking
  const [checked, setChecked] = React.useState(false);

  // Subscribe to Firebase Auth state on mount
  React.useEffect(() => {
    let unsub = null;
    getClientAuth().then((auth) => {
      if (!auth) {
        // Firebase not configured — skip auth for local dev
        setUser(null);
        setChecked(true);
        return;
      }
      import('firebase/auth').then(({ onAuthStateChanged }) => {
        unsub = onAuthStateChanged(auth, (u) => {
          setUser(u || null);
          setChecked(true);
        });
      });
    });
    return () => { if (unsub) unsub(); };
  }, []);

  async function handleSignOut() {
    const auth = await getClientAuth();
    if (!auth) return;
    const { signOut } = await import('firebase/auth');
    await signOut(auth);
    setUser(null);
  }

  // Still checking auth state — show a minimal loader
  if (!checked) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        fontFamily: 'var(--font-display)',
        fontSize: 22,
        color: 'var(--muted)',
        letterSpacing: '0.04em',
      }}>
        DM Beauty · Loading…
      </div>
    );
  }

  // Not signed in — show Google login gate
  if (!user) {
    return <AdminLogin onSignedIn={(u) => setUser(u)} />;
  }

  // Signed in — show real-time dashboard
  return <AdminDashboard user={user} onSignOut={handleSignOut} />;
}
