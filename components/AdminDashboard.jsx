'use client';
// Admin dashboard — real-time Firestore via onSnapshot.
// Booking status updates via PATCH /api/bookings/[id].
// Protected: must be signed in (AdminLogin gate).
import React from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import {
  SERVICES, GALLERY,
  IconGrid, IconCalendar, IconUser, IconPackage, IconImage,
  IconChart, IconSettings, IconBell, IconClock,
  IconBridal, IconMakeup, IconHair, IconFacial, IconNail, IconWax, IconBrow, IconSpa, IconMani,
  IconPhone, IconWa
} from '@/lib/data';
import { invalidateCached } from '@/lib/clientCache';

const ICON_MAP = {
  Bridal: IconBridal,
  Makeup: IconMakeup,
  Hair: IconHair,
  Skin: IconFacial,
  Nails: IconNail,
  Waxing: IconWax,
  Threading: IconBrow,
  Spa: IconSpa,
  Mani: IconMani,
  Package: IconPackage,
};

const IconBoxes = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
  </svg>
);

const IconStarLine = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconMsg = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);

const IconWalkIn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

import { enableStudioNotifications, isClientConfigured, getClientDb } from '@/lib/firebaseClient';
import { useSettings } from '@/lib/settings';
import { useAppearance } from '@/lib/appearance';

// ── Real-time booking hook ────────────────────────────────────
function useRealtimeBookings() {
  const [bookings, setBookings] = React.useState(null); // null = loading
  const [error, setError]       = React.useState(null);

  React.useEffect(() => {
    let unsub = null;

    getClientDb().then((db) => {
      if (!db) {
        // Firebase not configured — fall back to REST GET
        fetch('/api/bookings')
          .then((r) => r.json())
          .then((j) => setBookings(j.bookings || []))
          .catch(() => setBookings([]));
        return;
      }

      // Real-time Firestore listener
      import('firebase/firestore').then(({ collection, query, orderBy, onSnapshot }) => {
        const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
        unsub = onSnapshot(
          q,
          (snap) => setBookings(snap.docs.map((d) => d.data())),
          (err)  => { console.error('onSnapshot error:', err); setError(err.message); }
        );
      });
    });

    return () => { if (unsub) unsub(); };
  }, []);

  return { bookings, error };
}

// ── Real-time payments hook ───────────────────────────────────
function useRealtimePayments() {
  const [payments, setPayments] = React.useState(null); // null = loading
  const [error, setError]       = React.useState(null);
  const usesRest = React.useRef(false);

  const refreshPayments = React.useCallback(() => {
    if (!usesRest.current) return;
    fetch('/api/payments')
      .then((r) => r.json())
      .then((j) => setPayments(j.payments || []))
      .catch(() => setPayments([]));
  }, []);

  React.useEffect(() => {
    let unsub = null;

    getClientDb().then((db) => {
      if (!db) {
        usesRest.current = true;
        fetch('/api/payments')
          .then((r) => r.json())
          .then((j) => setPayments(j.payments || []))
          .catch(() => setPayments([]));
        return;
      }

      import('firebase/firestore').then(({ collection, query, orderBy, onSnapshot }) => {
        const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
        unsub = onSnapshot(
          q,
          (snap) => setPayments(snap.docs.map((d) => d.data())),
          (err)  => { console.error('onSnapshot error:', err); setError(err.message); }
        );
      });
    });

    return () => { if (unsub) unsub(); };
  }, []);

  return { payments, error, refreshPayments };
}

// ── Update booking status ─────────────────────────────────────
async function updateStatus(id, status) {
  const res = await fetch(`/api/bookings/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
}

// ── Row shape normaliser ──────────────────────────────────────
function toRow(b) {
  return {
    id:        b.id,
    time:      b.slot  || '—',
    name:      b.name,
    phone:     b.phone || '—',
    email:     b.email || '—',
    svc:       b.serviceName || b.serviceId,
    price:     b.price ?? 0,
    status:    b.status || 'pending',
    reference: b.reference,
    date:      b.date,
  };
}

// ══════════════════════════════════════════════════════════════
// ── Global Snackbar (Toast) System ────────────────────────────
// ══════════════════════════════════════════════════════════════
const SnackbarContext = React.createContext(null);

function SnackbarProvider({ children }) {
  const [snacks, setSnacks] = React.useState([]);
  const [confirmState, setConfirmState] = React.useState(null); // { msg, resolve }

  const toast = React.useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setSnacks(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setSnacks(prev => prev.filter(s => s.id !== id)), 3500);
  }, []);

  const confirm = React.useCallback((msg, opts = {}) => {
    return new Promise((resolve) => {
      setConfirmState({ msg, resolve, ...opts });
    });
  }, []);

  const resolveConfirm = (result) => {
    if (confirmState) {
      confirmState.resolve(result);
      setConfirmState(null);
    }
  };

  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  const colors = {
    success: { bg: '#1a2e1a', border: 'rgba(58,125,68,0.5)', icon: '#4caf50' },
    error:   { bg: '#2e1a1a', border: 'rgba(220,50,50,0.5)',  icon: '#ef5350' },
    info:    { bg: '#1a1a2e', border: 'rgba(90,90,220,0.4)',  icon: '#7986cb' },
  };

  return (
    <SnackbarContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Toast stack — bottom-right */}
      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none'
      }}>
        {snacks.map(s => {
          const c = colors[s.type] || colors.success;
          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 18px',
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: 10,
              boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
              fontSize: 13, fontWeight: 500,
              color: '#fff',
              pointerEvents: 'auto',
              animation: 'snackIn 0.3s cubic-bezier(.22,1,.36,1) both',
              maxWidth: 360, minWidth: 220
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: '50%',
                background: c.icon + '22',
                color: c.icon,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, flexShrink: 0
              }}>{icons[s.type]}</span>
              <span style={{ flex: 1 }}>{s.msg}</span>
            </div>
          );
        })}
      </div>

      {/* Confirm dialog */}
      {confirmState && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--line)',
            borderRadius: 12, padding: '28px 32px', maxWidth: 380, width: '100%',
            boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
            animation: 'snackIn 0.25s cubic-bezier(.22,1,.36,1) both'
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(220,50,50,0.1)', border: '1px solid rgba(220,50,50,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 22
            }}>⚠</div>
            <p style={{
              margin: '0 0 24px', textAlign: 'center',
              fontSize: 15, color: 'var(--ink)', lineHeight: 1.55
            }}>{confirmState.msg}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => resolveConfirm(false)} style={{
                flex: 1, padding: '11px', borderRadius: 24,
                border: '1px solid var(--line-2)', background: 'var(--bg-soft)',
                color: 'var(--ink)', fontWeight: 600, fontSize: 13,
                cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase'
              }}>{confirmState.cancelLabel || 'Keep it'}</button>
              <button onClick={() => resolveConfirm(true)} style={{
                flex: 1, padding: '11px', borderRadius: 24,
                border: 'none', background: confirmState.confirmColor || '#dc3545',
                color: '#fff', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase'
              }}>{confirmState.confirmLabel || 'Yes, Delete'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes snackIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }

        @keyframes tooltipFade {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        /* Responsive catalog grid for services/packages catalog */
        .admin-catalog-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .admin-catalog-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .admin-catalog-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Responsive mini stats in appointments tab */
        .appt-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 1024px) {
          .appt-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        /* Appointment filter controls — always a flex row (scrolls on mobile) */
        .appt-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: nowrap;
        }

        @media (max-width: 560px) {
          /* On mobile: the whole row scrolls horizontally as one unit */
          .appt-controls {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .appt-controls::-webkit-scrollbar { display: none; }
          .appt-controls .chip-row { flex-wrap: nowrap; flex-shrink: 0; }
          .appt-controls .btn { flex-shrink: 0; margin-left: auto; }

          /* ── Mobile appointments: drop the outer panel card,
             hide the timeline track, let each card be the hero ── */
          .appt-list-panel {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .appt-list-body {
            padding: 12px 0 0 !important;
          }
          /* Hide the left time column and dot on mobile */
          .appt-timeline-col,
          .appt-timeline-dot {
            display: none !important;
          }
          /* Remove gap so card takes full width */
          .appt-timeline-row {
            gap: 0 !important;
          }
        }

        /* Stack action buttons on mobile to prevent overflow */
        @media (max-width: 560px) {
          .appt-card-action-row {
            flex-direction: column !important;
            align-items: stretch !important;
            gap: 12px !important;
          }
          .appt-card-action-buttons {
            justify-content: flex-end !important;
            width: 100% !important;
          }

          /* ── Dashboard mobile: same card-focused look as Appointments ── */
          .dash-live-panel {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
          .dash-live-panel .appt-list {
            padding-top: 12px;
          }
          /* Hide "This Week" chart panel on mobile */
          .dash-week-panel { display: none !important; }
          /* Stat cards: 2 columns on dashboard mobile */
          .dash-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
        }
      `}</style>
    </SnackbarContext.Provider>
  );
}

function useSnackbar() {
  return React.useContext(SnackbarContext);
}

// ── Mobile Admin Bar (sub-component so it can use useSnackbar) ──
function MobileAdminBar({ user, onSignOut }) {
  const router = useRouter();
  const { confirm, toast } = useSnackbar();

  async function handleLogout() {
    const ok = await confirm('Are you sure you want to sign out?', {
      cancelLabel: 'Stay',
      confirmLabel: 'Sign Out',
      confirmColor: 'var(--gold-deep, #8c6a44)',
    });
    if (ok) {
      toast('Signing out…', 'info');
      setTimeout(() => onSignOut(), 600);
    }
  }

  return (
    <div className="mobile-admin-bar">
      {/* Clicking "DM Beauty" navigates to the public website */}
      <button
        className="mobile-admin-bar-brand"
        onClick={() => router.push('/')}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left' }}
      >
        <span className="mobile-admin-bar-shop">DM Beauty</span>
        <span className="mobile-admin-bar-user">{user?.email || 'dmbeauty.medak@gmail.com'}</span>
      </button>
      <div className="mobile-admin-bar-actions">
        <ThemeToggle />
        <NotificationBell />
        <button
          className="mobile-logout-btn"
          title="Sign out"
          aria-label="Sign out"
          onClick={handleLogout}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Admin Sidebar (sub-component so it can use useSnackbar) ──
function AdminSidebar({ user, onSignOut, tab, setTab, bookings, rawBookings, router, messagesNew = null }) {
  const { confirm, toast } = useSnackbar();

  async function handleLogout() {
    const ok = await confirm('Are you sure you want to sign out?', {
      cancelLabel: 'Stay',
      confirmLabel: 'Sign Out',
      confirmColor: 'var(--gold-deep, #8c6a44)',
    });
    if (ok) {
      toast('Signing out…', 'info');
      setTimeout(() => onSignOut(), 600);
    }
  }

  return (
    <aside className="admin-side">
      <div className="logo" style={{ borderBottom: 'none', marginBottom: 16, paddingBottom: 0 }}>
        DM Beauty
        <small style={{ textTransform: 'none', letterSpacing: '0.05em', fontSize: 11, marginTop: 4 }}>
          {user?.email || 'dmbeauty.medak@gmail.com'}
        </small>
      </div>

      {/* Toggles & Buttons (desktop only) */}
      <div className="admin-user-card" style={{ padding: '0 28px 24px', borderBottom: '1px solid var(--line-2)', marginBottom: 20 }}>
        {/* Action Row 1: Toggles (Theme + Notifications) */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
          <ThemeToggle />
          <NotificationBell />
        </div>

        {/* Action Row 2: Buttons (Site + Sign Out) */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/')}
            style={{ flex: 1, fontSize: 11, color: 'var(--ink)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 0', border: '1px solid var(--line-2)', borderRadius: 4, background: 'var(--bg-soft)', cursor: 'pointer' }}>
            ← Site
          </button>
          <button onClick={handleLogout}
            style={{ flex: 1, fontSize: 11, color: 'var(--danger)', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '8px 0', border: '1px solid var(--line-2)', borderRadius: 4, background: 'var(--bg-soft)', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </div>

      <nav className="admin-nav">
        <NavItem icon={<IconGrid />}     label="Dashboard"    active={tab==='dashboard'} onClick={() => setTab('dashboard')} />
        <NavItem icon={<IconWalkIn />}   label="Walk-in Cash" active={tab==='walkin'}    onClick={() => setTab('walkin')} />
        <NavItem icon={<IconCalendar />} label="Appointments" active={tab==='appts'}     onClick={() => setTab('appts')}
          badge={rawBookings === null ? '…' : String(bookings.filter(b=>b.status==='pending').length || '')} />
        <NavItem icon={<IconUser />}     label="Customers"    active={tab==='customers'} onClick={() => setTab('customers')} />
        <NavItem icon={<IconPackage />}  label="Services"     active={tab==='services'}  onClick={() => setTab('services')} />
        <NavItem icon={<IconBoxes />}    label="Packages"     active={tab==='packages'}  onClick={() => setTab('packages')} />
        <NavItem icon={<IconImage />}    label="Gallery"      active={tab==='gallery'}   onClick={() => setTab('gallery')} />
        <NavItem icon={<IconStarLine />} label="Reviews"      active={tab==='reviews'}   onClick={() => setTab('reviews')} />
        <NavItem icon={<IconChart />}    label="Analytics"    active={tab==='analytics'} onClick={() => setTab('analytics')} />
        <NavItem icon={<IconMsg />}      label="Messages"     active={tab==='messages'}  onClick={() => setTab('messages')}
          badge={messagesNew === null ? '' : String(messagesNew || '')} />
        <NavItem icon={<IconSettings />} label="Settings"     active={tab==='settings'}  onClick={() => setTab('settings')} />
      </nav>
    </aside>
  );
}

// ═══════════════════════════════════════════════════════════════
export function AdminDashboard({ user, onSignOut }) {
  const router = useRouter();
  const [tab, setTab] = React.useState('dashboard');
  const { bookings: rawBookings, error: rtError } = useRealtimeBookings();
  const { payments: rawPayments, error: paymentsError, refreshPayments } = useRealtimePayments();
  const [paymentModalOpen, setPaymentModalOpen] = React.useState(false);

  // Dynamic services, gallery & packages state
  const [services, setServices] = React.useState(null);
  const [gallery, setGallery] = React.useState(null);
  const [packages, setPackages] = React.useState(null);

  // Each fetcher also drops the public pages' client cache for its URL —
  // they re-run after every admin write, so the website picks up edits
  // immediately instead of serving the cached copy until the TTL expires.
  const fetchServices = React.useCallback(async () => {
    try {
      invalidateCached('/api/services');
      const res = await fetch('/api/services');
      const json = await res.json();
      setServices(json.services || []);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  }, []);

  const fetchGallery = React.useCallback(async () => {
    try {
      invalidateCached('/api/gallery');
      const res = await fetch('/api/gallery');
      const json = await res.json();
      setGallery(json.gallery || []);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    }
  }, []);

  const fetchPackages = React.useCallback(async () => {
    try {
      invalidateCached('/api/packages');
      const res = await fetch('/api/packages');
      const json = await res.json();
      setPackages(json.packages || []);
    } catch (err) {
      console.error('Failed to fetch packages:', err);
    }
  }, []);

  // Availability toggles patch one service — update local state directly
  // instead of refetching the whole catalog after every click.
  const patchServiceLocal = React.useCallback((id, patch) => {
    invalidateCached('/api/services');
    setServices((prev) => (prev ? prev.map((s) => (s.id === id ? { ...s, ...patch } : s)) : prev));
  }, []);

  const [reviews, setReviews] = React.useState(null);
  const fetchReviews = React.useCallback(async () => {
    try {
      invalidateCached('/api/reviews');
      const res = await fetch('/api/reviews');
      const json = await res.json();
      setReviews(json.reviews || []);
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  }, []);

  const [messages, setMessages] = React.useState(null);
  const fetchMessages = React.useCallback(async () => {
    try {
      const res = await fetch('/api/messages');
      const json = await res.json();
      setMessages(json.messages || []);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    }
  }, []);

  // Lazy-load each dataset the first time its tab is opened — a fresh admin
  // load makes zero catalog/messages API calls. The ref guard also stops
  // StrictMode's dev double-mount from firing every request twice.
  const loadedRef = React.useRef({});
  React.useEffect(() => {
    const loaders = {
      messages: fetchMessages,
      services: fetchServices,
      gallery: fetchGallery,
      packages: fetchPackages,
      reviews: fetchReviews,
    };
    if (loaders[tab] && !loadedRef.current[tab]) {
      loadedRef.current[tab] = true;
      loaders[tab]();
    }
  }, [tab, fetchServices, fetchGallery, fetchPackages, fetchMessages, fetchReviews]);

  const bookings = React.useMemo(
    () => (rawBookings || []).map(toRow),
    [rawBookings]
  );

  const revenue = bookings.filter(b => b.status !== 'cancelled').reduce((s, a) => s + Number(a.price || 0), 0);

  const walkinRevenue = React.useMemo(() => {
    if (!rawPayments) return 0;
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
    oneMonthAgo.setHours(0, 0, 0, 0);

    return rawPayments
      .filter((p) => {
        if (!p.date) return false;
        try {
          const pd = new Date(p.date + 'T00:00:00');
          if (isNaN(pd.getTime())) return false;
          return pd >= oneMonthAgo && pd <= now;
        } catch (e) {
          return false;
        }
      })
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
  }, [rawPayments]);

  return (
    <SnackbarProvider>

    {/* ── Mobile-only slim info bar — sticky above nav tabs ── */}
    <MobileAdminBar user={user} onSignOut={onSignOut} />

    <div className="admin-shell fade-in">
      {/* ── Sidebar ── */}
      <AdminSidebar
        user={user}
        onSignOut={onSignOut}
        tab={tab}
        setTab={setTab}
        bookings={bookings}
        rawBookings={rawBookings}
        router={router}
        messagesNew={messages === null ? null : messages.filter((m) => m.status === 'new').length}
      />

      {/* ── Main ── */}
      <main className="admin-main">

        <header className="admin-head">
          <div>
            <h1>{{ dashboard:'Dashboard', appts:'Appointments', customers:'Customers', messages:'Messages', services:'Services', walkin:'Walk-in Cash', packages:'Packages', gallery:'Gallery', analytics:'Analytics', settings:'Settings' }[tab]}</h1>
            <div className="sub">
              {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
              {' · '}
              {rawBookings === null
                ? <span style={{ color: 'var(--muted)' }}>Loading…</span>
                : <><span style={{ color: 'var(--gold-deep)' }}>{bookings.filter(b=>b.status==='pending').length} pending</span> · {bookings.length} total</>
              }
              {/* Real-time indicator */}
              <span title="Live — updates automatically" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 10, fontSize: 11, color: 'var(--success, #3a7d44)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: 'pulse 2s infinite' }} />
                LIVE
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {tab === 'walkin' && (
              <button className="btn btn-primary" onClick={() => setPaymentModalOpen(true)}>+ Add Payment</button>
            )}
            {tab !== 'walkin' && (
              <button className="btn btn-primary" onClick={() => router.push('/booking')}>+ New Booking</button>
            )}
          </div>
        </header>

        {(rtError || paymentsError) && (
          <div style={{ margin: '0 0 16px', padding: '12px 16px', background: 'rgba(220,50,50,0.06)', border: '1px solid rgba(220,50,50,0.2)', borderRadius: 4, color: 'var(--danger)', fontSize: 13 }}>
            ⚠ Firestore error: {rtError || paymentsError}
          </div>
        )}

        {tab === 'dashboard'  && <DashboardView  setTab={setTab} bookings={bookings} loading={rawBookings===null} revenue={revenue} walkinRevenue={walkinRevenue} />}
        {tab === 'appts'      && <AppointmentsView bookings={bookings} loading={rawBookings===null} />}
        {tab === 'customers'  && <CustomersView bookings={bookings} loading={rawBookings===null} setTab={setTab} />}
        {tab === 'messages'   && <MessagesView messages={messages} loading={messages===null} onRefresh={fetchMessages} />}
        {tab === 'services'   && <ServicesView services={services} loading={services===null} onRefresh={fetchServices} onPatch={patchServiceLocal} />}
        {tab === 'walkin'     && (
          <WalkinCashView 
            payments={rawPayments} 
            loading={rawPayments === null} 
            modalOpen={paymentModalOpen}
            setModalOpen={setPaymentModalOpen}
            onRefresh={refreshPayments}
          />
        )}
        {tab === 'packages'   && <PackagesAdminView packages={packages} loading={packages===null} onRefresh={fetchPackages} />}
        {tab === 'gallery'    && <GalleryAdminView gallery={gallery} loading={gallery===null} onRefresh={fetchGallery} />}
        {tab === 'reviews'    && <ReviewsAdminView reviews={reviews} loading={reviews===null} onRefresh={fetchReviews} />}
        {tab === 'analytics'  && <AnalyticsView bookings={bookings} payments={rawPayments} />}
        {tab === 'settings'   && <SettingsView user={user} />}
      </main>
    </div>
    </SnackbarProvider>
  );
}

// ── Notification bell ─────────────────────────────────────────
function NotificationBell() {
  const [state, setState] = React.useState('idle');
  const enable = async () => {
    if (!isClientConfigured()) { setState('error'); return; }
    setState('enabling');
    const { enableStudioNotifications } = await import('@/lib/firebaseClient');
    const res = await enableStudioNotifications();
    setState(res.ok ? 'on' : 'error');
  };
  const title = state==='on' ? 'Notifications enabled'
    : state==='enabling' ? 'Enabling…'
    : state==='error'    ? 'Notifications unavailable'
    : 'Enable push notifications';
  return (
    <button onClick={enable} title={title}
      style={{ position:'relative', width:38, height:38, borderRadius:'50%', background:'var(--bg)', border:'1px solid var(--line-2)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink-2)' }}>
      <IconBell />
      <span style={{ position:'absolute', top:6, right:8, width:7, height:7, background: state==='on' ? 'var(--success,#3a7d44)' : 'var(--gold)', borderRadius:'50%' }} />
    </button>
  );
}

// ── Sidebar nav item ──────────────────────────────────────────
function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <div className={'admin-nav-item ' + (active ? 'active' : '')} onClick={onClick}>
      {icon}
      <span style={{ flex: 1 }}>{label}</span>
      {badge && badge !== '0' && badge !== '' && (
        <span style={{ fontSize:11, padding:'2px 8px', background: active ? 'rgba(255,255,255,0.18)' : 'var(--gold-tint)', color: active ? '#fff' : 'var(--gold-deep)', borderRadius:999 }}>
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Premium Timeline Appointment Card ────────────────────────
function ApptRow({ a }) {
  const { tweaks } = useAppearance();
  const isDark = tweaks.theme === 'dark';
  const [busy, setBusy] = React.useState(false);
  const [rescheduleOpen, setRescheduleOpen] = React.useState(false);
  const [rescheduleDate, setRescheduleDate] = React.useState(a.date || '');
  const [rescheduleSlot, setRescheduleSlot] = React.useState(a.time || '');

  const SLOTS = ['10:00','11:00','12:00','13:00','14:30','15:30','16:30','17:30','18:30'];

  const change = async (status) => {
    if (!a.id || busy) return;
    setBusy(true);
    try { await updateStatus(a.id, status); } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const saveReschedule = async (e) => {
    e.preventDefault();
    if (!a.id || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/bookings/${a.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: rescheduleDate, slot: rescheduleSlot })
      });
      if (!res.ok) throw new Error('Failed to reschedule');
      setRescheduleOpen(false);
    } catch (e) { alert(e.message); }
    finally { setBusy(false); }
  };

  const statusColors = {
    confirmed: { bg: 'rgba(58,125,68,0.1)', color: '#3a7d44', dot: '#3a7d44', border: 'rgba(58,125,68,0.25)' },
    pending:   { bg: 'rgba(220,160,60,0.1)',  color: '#b8862a', dot: '#d4a017', border: 'rgba(220,160,60,0.25)' },
    done:      { bg: 'rgba(100,100,100,0.08)', color: 'var(--muted)', dot: 'var(--muted)', border: 'var(--line)' },
    cancelled: { bg: 'rgba(220,50,50,0.07)',  color: '#c0392b', dot: '#c0392b', border: 'rgba(220,50,50,0.2)' },
  };
  const sc = statusColors[a.status] || statusColors.pending;

  // Duration from time string e.g. "4.5 hrs"
  const durationLabel = a.duration || '';

  return (
    <>
      <div className="appt-timeline-row" style={{
        display: 'flex',
        gap: 16,
        alignItems: 'stretch',
      }}>
        {/* Left time column */}
        <div className="appt-timeline-col" style={{ width: 52, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: 2 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', letterSpacing: '-0.02em' }}>{a.time}</div>
          {durationLabel && <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>{durationLabel}</div>}
          <div style={{ flex: 1, marginTop: 8, width: 1, background: 'var(--line)', minHeight: 24, alignSelf: 'center' }} />
        </div>

        {/* Timeline dot */}
        <div className="appt-timeline-dot" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 5, flexShrink: 0 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: sc.dot, boxShadow: `0 0 0 3px ${sc.bg}` }} />
        </div>

        {/* Card */}
        <div style={{
          flex: 1,
          marginBottom: 16,
          background: 'var(--bg)',
          border: `1px solid var(--line)`,
          borderLeft: `3px solid ${sc.dot}`,
          borderRadius: 8,
          padding: '14px 18px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10
        }}>
          {/* Card top row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'var(--bg-cream)', color: 'var(--gold-deep)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, flexShrink: 0
              }}>
                {a.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', lineHeight: 1.2 }}>{a.name}</div>
                <div style={{ fontSize: 13, color: 'var(--gold-deep)', marginTop: 2, fontStyle: 'italic' }}>{a.svc}</div>
              </div>
            </div>

            {/* Status pill */}
            <div style={{
              padding: '3px 10px',
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              background: sc.bg,
              color: sc.color,
              border: `1px solid ${sc.border}`,
              flexShrink: 0
            }}>{a.status}</div>
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {a.time}{durationLabel ? ` — ${durationLabel}` : ''}
            </div>
            {a.date && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            )}
            {a.phone && a.phone !== '—' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.58 2.34h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {a.phone}
              </div>
            )}
          </div>

          {/* Price + action buttons */}
          <div className="appt-card-action-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 2 }}>
            <div style={{ fontSize: 15, color: 'var(--gold-deep)', fontWeight: 700 }}>
              ₹{Number(a.price || 0).toLocaleString('en-IN')}
            </div>

            <div className="appt-card-action-buttons" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {busy ? (
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Saving…</span>
              ) : a.status === 'pending' ? (
                <>
                  <button onClick={() => change('cancelled')} style={{
                    padding: '7px 14px', borderRadius: 20, border: '1px solid var(--line)',
                    background: 'var(--bg)', color: 'var(--ink)', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase'
                  }}>Decline</button>
                  <button onClick={() => change('confirmed')} style={{
                    padding: '7px 18px', borderRadius: 20, border: 'none',
                    background: 'var(--ink)', color: 'var(--bg)', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase'
                  }}>Accept</button>
                </>
              ) : a.status === 'confirmed' ? (
                <>
                  <button onClick={() => setRescheduleOpen(true)} style={{
                    padding: '7px 14px', borderRadius: 20, border: '1px solid var(--line)',
                    background: 'var(--bg)', color: 'var(--ink)', fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase'
                  }}>Reschedule</button>
                  <button onClick={() => change('done')} style={{
                    width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--line)',
                    background: 'var(--bg)', color: 'var(--muted)', fontSize: 16,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>···</button>
                </>
              ) : a.status === 'done' ? (
                <span style={{ fontSize: 11, color: 'var(--muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Completed</span>
              ) : (
                <button onClick={() => change('pending')} style={{
                  padding: '7px 14px', borderRadius: 20, border: '1px solid var(--line)',
                  background: 'var(--bg)', color: 'var(--muted)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase'
                }}>Reopen</button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reschedule modal */}
      {rescheduleOpen && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'var(--bg)', border:'1px solid var(--line)', borderRadius:10, width:'100%', maxWidth:420, padding:32, boxSizing:'border-box' }} className="fade-in">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, margin:0, color:'var(--ink)' }}>Reschedule</h3>
              <button onClick={() => setRescheduleOpen(false)} style={{ width:32, height:32, borderRadius:'50%', border:'none', background:'var(--bg-soft)', color:'var(--ink)', cursor:'pointer', fontSize:14, fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:13, color:'var(--muted)', marginBottom:4 }}>Patient</div>
              <div style={{ fontSize:15, fontWeight:600, color:'var(--ink)' }}>{a.name}</div>
              <div style={{ fontSize:13, color:'var(--gold-deep)', marginTop:2, fontStyle:'italic' }}>{a.svc}</div>
            </div>
            <form onSubmit={saveReschedule} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="field">
                <label style={{ display:'block', marginBottom:8, fontSize:13, fontWeight:500, color:'var(--ink)' }}>New Date</label>
                <input type="date" required value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)}
                  style={{ width:'100%', boxSizing:'border-box', padding:'10px 12px', borderRadius:6, border:'1px solid var(--line)', background:'var(--bg)', color:'var(--ink)', fontSize:14, outline:'none', colorScheme: isDark ? 'dark' : 'light' }} />
              </div>
              <div className="field">
                <label style={{ display:'block', marginBottom:8, fontSize:13, fontWeight:500, color:'var(--ink)' }}>Time Slot</label>
                <select value={rescheduleSlot} onChange={e => setRescheduleSlot(e.target.value)}
                  style={{ width:'100%', boxSizing:'border-box', height:40, padding:'0 10px', borderRadius:6, border:'1px solid var(--line)', background:'var(--bg)', color:'var(--ink)', fontSize:14, outline:'none' }}>
                  {SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:6 }}>
                <button type="submit" disabled={busy} style={{ width:'100%', padding:'12px', borderRadius:24, background:'var(--ink)', color:'var(--bg)', border:'none', fontWeight:700, cursor: busy ? 'not-allowed' : 'pointer', fontSize:13, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                  {busy ? 'Saving…' : 'Confirm Reschedule'}
                </button>
                <button type="button" onClick={() => change('cancelled')} disabled={busy} style={{ width:'100%', padding:'12px', borderRadius:24, background:'transparent', color:'var(--danger,#dc3545)', border:'1px solid var(--danger,#dc3545)', fontWeight:600, cursor: busy ? 'not-allowed' : 'pointer', fontSize:13, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                  Cancel Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// ── Dashboard overview ────────────────────────────────────────
function DashboardView({ setTab, bookings, loading, revenue, walkinRevenue = 0 }) {
  const pendingCount   = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const stats = [
    { lbl: "Today's Bookings",   v: loading ? '…' : String(bookings.length),                    delta: `${pendingCount} pending`,         up: true },
    { lbl: 'Revenue · Booked & Walk-in',   v: loading ? '…' : '₹' + (revenue + walkinRevenue).toLocaleString('en-IN'),      delta: `${confirmedCount} confirmed · ₹${walkinRevenue.toLocaleString('en-IN')} walk-in (1m)`,     up: true },
    { lbl: 'Avg. Rating',        v: '4.9',                                                        delta: '312 reviews',                     up: true },
    { lbl: 'Studio Status',      v: 'Open',                                                       delta: 'Tue–Sun · 10am–8pm',              up: true },
  ];

  // Dynamic weekly chart based on real bookings
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekMap = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  bookings.forEach((b) => {
    if (b.status === 'cancelled') return;
    if (!b.date) return;
    const parts = b.date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const dayIndex = d.getDay(); // 0 = Sun, 1 = Mon...
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex];
        weekMap[dayName] = (weekMap[dayName] || 0) + 1;
      }
    }
  });

  const weekList = weekDays.map((d) => ({ d, v: weekMap[d] }));
  const maxW = Math.max(...weekList.map((w) => w.v), 1);
  const week = weekList.map((w) => ({
    d: w.d,
    v: w.v,
    h: Math.max((w.v / maxW) * 96, 4), // min height 4% for design aesthetics
  }));

  // Dynamic top services
  const serviceCounts = {};
  bookings.forEach((b) => {
    if (b.status === 'cancelled') return;
    const name = b.svc || 'Other';
    serviceCounts[name] = (serviceCounts[name] || 0) + 1;
  });

  const topServicesRaw = Object.entries(serviceCounts)
    .map(([n, count]) => ({ n, b: count }))
    .sort((a, b) => b.b - a.b)
    .slice(0, 4);

  // If there are no bookings, show placeholder top services, otherwise show real ones
  const topServices = topServicesRaw.length > 0 ? topServicesRaw : [
    { n: 'Bridal Signature', b: 0 },
    { n: 'Gold Glow Facial', b: 0 },
    { n: 'Hair Spa', b: 0 },
    { n: 'Gel Nail Art', b: 0 },
  ];
  const maxServiceCount = Math.max(...topServices.map(t => t.b), 1);

  const today = bookings.slice(0, 6);
  return (
    <>
      <div className="stat-grid dash-stat-grid">
        {stats.map((s) => (
          <div key={s.lbl} className="stat-card">
            <div className="lbl">{s.lbl}</div>
            <div className="v">{s.v}</div>
            <div className={'delta ' + (s.up ? 'up' : 'down')}>{s.up ? '▲' : '▼'} {s.delta}</div>
          </div>
        ))}
      </div>

      <div className="admin-grid">
        <div className="panel dash-live-panel">
          <div className="panel-head">
            <h3>Live Bookings</h3>
            <span className="lnk" onClick={() => setTab('appts')}>View all →</span>
          </div>
          <div className="appt-list">
            {loading && <div style={{ color:'var(--muted)', padding:'24px 0', fontSize:14 }}>Loading live bookings…</div>}
            {!loading && today.length === 0 && <div style={{ color:'var(--muted)', padding:'24px 0', fontSize:14 }}>No bookings yet — they'll appear here in real-time.</div>}
            {today.map((a, i) => <ApptRow key={a.id || i} a={a} />)}
          </div>
        </div>

        <div className="panel dash-week-panel">
          <div className="panel-head"><h3>This Week</h3></div>
          <div className="chart">
            {week.map((w, i) => (
              <div key={i} className="bar" style={{ height: w.h + '%', opacity: w.v === 0 ? 0.3 : 1 }}>
                {w.v > 0 && <div className="v">{w.v}</div>}
              </div>
            ))}
          </div>
          <div className="chart-labels">{week.map((w) => <div key={w.d}>{w.d}</div>)}</div>

          <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid var(--line)' }}>
            <div className="panel-head" style={{ margin:0 }}><h3 style={{ fontSize:18 }}>Top Services</h3></div>
            <div style={{ marginTop:16, display:'flex', flexDirection:'column', gap:14 }}>
              {topServices.map((t) => (
                <div key={t.n}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:6 }}>
                    <span>{t.n}</span><span style={{ color:'var(--muted)' }}>{t.b} bookings</span>
                  </div>
                  <div style={{ height:4, background:'var(--bg-soft)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', background:'var(--gold)', width:(t.b/maxServiceCount*100)+'%' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Appointments full view (premium timeline) ─────────────────
function AppointmentsView({ bookings, loading }) {
  const [filter, setFilter] = React.useState('All');

  const pendingCount   = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const doneCount      = bookings.filter(b => b.status === 'done').length;
  const revenue        = bookings.filter(b => b.status !== 'cancelled').reduce((s, b) => s + Number(b.price || 0), 0);

  const list = filter === 'All' ? bookings : bookings.filter((a) => a.status === filter.toLowerCase());

  function exportCSV() {
    const rows = [
      ['Reference','Name','Service','Date','Time','Status','Price'],
      ...bookings.map(a => [a.reference||'', a.name, a.svc, a.date||'', a.time, a.status, a.price]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type:'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = 'bookings.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Stats mini-strip */}
      <div className="appt-stats-grid">
        {[
          { lbl: "Today's Bookings",   v: loading ? '…' : bookings.length,                                  color: 'var(--ink)' },
          { lbl: 'Confirmed',          v: loading ? '…' : confirmedCount,                                   color: '#3a7d44' },
          { lbl: 'Awaiting Approval',  v: loading ? '…' : pendingCount,  accent: pendingCount > 0,          color: pendingCount > 0 ? '#b8862a' : 'var(--ink)' },
          { lbl: 'Booked Revenue',     v: loading ? '…' : `₹${revenue.toLocaleString('en-IN')}`,           color: 'var(--gold-deep)' },
        ].map(s => (
          <div key={s.lbl} style={{
            background: 'var(--bg)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '18px 20px',
            boxShadow: s.accent ? '0 0 0 1px rgba(220,160,60,0.3)' : 'none'
          }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: s.color, letterSpacing: '-0.02em' }}>{s.v}</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginTop: 4 }}>{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="panel appt-list-panel">
        {/* Filters + export — single scrollable row (same pattern as Customers) */}
        <div className="panel-head" style={{ padding: 0 }}>
          <div className="appt-controls">
            <div className="chip-row" style={{ marginBottom: 0, gap: 8, flexWrap: 'nowrap' }}>
              {['All','Confirmed','Pending','Done','Cancelled'].map((f) => (
                <span key={f} className={'chip ' + (filter===f ? 'active' : '')} onClick={() => setFilter(f)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{f}</span>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ fontSize:11, whiteSpace: 'nowrap', flexShrink: 0 }} onClick={exportCSV}>Export CSV</button>
          </div>
        </div>

        {/* Card grid — timeline rail hidden, cards side by side */}
        <style>{`
          .appt-list-body { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; align-items: stretch; }
          .appt-list-body > div[style*="text-align"] { grid-column: 1 / -1; }
          .appt-list-body .appt-timeline-col, .appt-list-body .appt-timeline-dot { display: none; }
          .appt-list-body .appt-timeline-row { gap: 0; height: 100%; }
          .appt-list-body .appt-timeline-row > div:last-child { margin-bottom: 0 !important; }
        `}</style>
        <div className="appt-list-body" style={{ padding: '20px 8px 8px' }}>
          {loading && <div style={{ color:'var(--muted)', padding:'24px 0', fontSize:14, textAlign:'center' }}>Connecting to Firestore…</div>}
          {!loading && list.length === 0 && <div style={{ color:'var(--muted)', padding:'48px 0', fontSize:14, textAlign:'center', border:'1px dashed var(--line-2)', borderRadius:6 }}>No appointments in this view.</div>}
          {!loading && list.map((a, i) => <ApptRow key={a.id || i} a={a} />)}
        </div>
      </div>
    </>
  );
}

// ── Messages (contact-form enquiries) ─────────────────────────
const QUICK_REPLIES = [
  'Thanks for reaching out!',
  'Yes, that slot is available.',
  'Could you share a reference photo?',
];

function MessagesView({ messages, loading, onRefresh }) {
  const { toast, confirm } = useSnackbar();
  const [filter, setFilter] = React.useState('all');
  const [selectedId, setSelectedId] = React.useState(null);
  const [reply, setReply] = React.useState('');

  const visible = (messages || []).filter((m) => m.status !== 'archived');
  const shown = filter === 'unread' ? visible.filter((m) => m.status === 'new') : visible;
  const unreadCount = visible.filter((m) => m.status === 'new').length;
  const selected = shown.find((m) => m.id === selectedId) || shown[0] || null;

  const timeAgo = (iso) => {
    if (!iso) return '';
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
    const days = Math.floor(hrs / 24);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  };

  const patch = async (id, status) => {
    try {
      await fetch(`/api/messages/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      onRefresh();
    } catch (e) {
      toast('Failed to update message', 'error');
    }
  };

  const select = (m) => {
    setSelectedId(m.id);
    setReply('');
    if (m.status === 'new') patch(m.id, 'read');
  };

  const markAllRead = () => visible.filter((m) => m.status === 'new').forEach((m) => patch(m.id, 'read'));

  const remove = async (m) => {
    const ok = await confirm('Delete this message permanently?');
    if (!ok) return;
    try {
      await fetch(`/api/messages/${m.id}`, { method: 'DELETE' });
      setSelectedId(null);
      onRefresh();
      toast('Message deleted');
    } catch (e) {
      toast('Failed to delete message', 'error');
    }
  };

  // Contact may be an email or a phone number — route the reply accordingly
  const contactDigits = (c) => String(c || '').replace(/\D/g, '');
  const isEmail = (c) => String(c || '').includes('@');

  const openWhatsApp = (m) => {
    const digits = contactDigits(m.email);
    if (digits.length < 8) { toast('No phone number on this enquiry', 'error'); return; }
    window.open(`https://wa.me/${digits}?text=${encodeURIComponent(reply || '')}`, '_blank');
  };

  const sendAndArchive = (m) => {
    if (isEmail(m.email)) {
      window.open(`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.service || 'Your enquiry'))}&body=${encodeURIComponent(reply || '')}`);
    } else if (contactDigits(m.email).length >= 8) {
      window.open(`https://wa.me/${contactDigits(m.email)}?text=${encodeURIComponent(reply || '')}`, '_blank');
    }
    patch(m.id, 'archived');
    setReply('');
    toast('Conversation archived');
  };

  return (
    <div className="panel">
      <style>{`
        .msg-grid { display: grid; grid-template-columns: 320px 1fr; gap: 0; border: 1px solid var(--line); border-radius: 8px; overflow: hidden; }
        .msg-list { border-right: 1px solid var(--line); max-height: 600px; overflow-y: auto; }
        .msg-item { padding: 14px 16px; border-bottom: 1px solid var(--line); cursor: pointer; display: flex; gap: 10px; }
        .msg-item:hover { background: var(--bg-soft); }
        .msg-item.sel { background: var(--bg-soft); box-shadow: inset 3px 0 0 var(--gold-deep); }
        .msg-detail { padding: 22px 24px; min-height: 420px; }
        .msg-back { display: none; }
        @media (max-width: 900px) {
          /* Drill-in pattern — list OR detail, never both */
          .msg-grid { grid-template-columns: 1fr; }
          .msg-list { border-right: 0; max-height: none; }
          .msg-grid.detail-open .msg-list { display: none; }
          .msg-grid:not(.detail-open) .msg-detail { display: none; }
          .msg-detail { padding: 16px; min-height: 0; }
          .msg-back {
            display: inline-flex; align-items: center; gap: 6px;
            margin-bottom: 14px; padding: 7px 14px;
            border: 1px solid var(--line-2); border-radius: 99px;
            background: var(--bg); color: var(--ink); font-size: 11px;
            font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
          }
        }
      `}</style>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 10, flexWrap: 'wrap' }}>
        <div className="chip-row" style={{ marginBottom: 0, gap: 8, flexWrap: 'nowrap' }}>
          <span className={'chip ' + (filter === 'all' ? 'active' : '')} onClick={() => setFilter('all')}>All · {visible.length}</span>
          <span className={'chip ' + (filter === 'unread' ? 'active' : '')} onClick={() => setFilter('unread')}>Unread · {unreadCount}</span>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ fontSize: 11, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ color: 'var(--muted)', padding: '32px 0', fontSize: 14, textAlign: 'center' }}>Loading messages…</div>
      ) : visible.length === 0 ? (
        <div style={{ color: 'var(--muted)', padding: '48px 0', fontSize: 14, textAlign: 'center', border: '1px dashed var(--line-2)', borderRadius: 6 }}>
          No messages yet — enquiries from the contact form will appear here.
        </div>
      ) : (
        <div className="msg-grid">
          {/* Left — conversation list */}
          <div className="msg-list">
            {shown.map((m) => (
              <div key={m.id} className={'msg-item ' + (selected?.id === m.id ? 'sel' : '')} onClick={() => select(m)}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-cream)', color: 'var(--gold-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, flexShrink: 0 }}>
                  {(m.name || '?')[0].toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontWeight: m.status === 'new' ? 700 : 600, fontSize: 13.5, color: 'var(--ink)' }}>{m.name}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--muted)', flexShrink: 0 }}>{timeAgo(m.createdAt)}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--gold-deep)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, margin: '2px 0' }}>{m.service}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{m.message}</div>
                </div>
                {m.status === 'new' && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold-deep)', flexShrink: 0, marginTop: 5 }} />}
              </div>
            ))}
            {shown.length === 0 && (
              <div style={{ color: 'var(--muted)', padding: '32px 16px', fontSize: 13, textAlign: 'center' }}>No unread messages.</div>
            )}
          </div>

          {/* Right — detail + reply */}
          {selected ? (
            <div className="msg-detail">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-cream)', color: 'var(--gold-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 17, flexShrink: 0 }}>
                    {(selected.name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--ink)' }}>{selected.name}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 2 }}>{selected.email}</div>
                  </div>
                </div>
                <button onClick={() => remove(selected)} title="Delete message" style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--line)', background: 'var(--bg)', color: 'var(--muted)', cursor: 'pointer', fontSize: 14 }}>🗑</button>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gold-deep)', background: 'rgba(140,106,68,0.1)', border: '1px solid rgba(140,106,68,0.2)', padding: '3px 10px', borderRadius: 99 }}>{selected.service}</span>
                <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{timeAgo(selected.createdAt)}</span>
              </div>

              <div style={{ background: 'var(--bg-soft)', border: '1px solid var(--line)', borderRadius: 8, padding: '14px 16px', fontSize: 14, lineHeight: 1.6, color: 'var(--ink)', marginBottom: 18, whiteSpace: 'pre-wrap' }}>
                {selected.message}
              </div>

              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Quick Reply</div>
              <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder={`Write a reply to ${(selected.name || '').split(' ')[0]}…`}
                style={{ width: '100%', boxSizing: 'border-box', minHeight: 72, padding: '10px 12px', borderRadius: 6, border: '1px solid var(--line-2)', background: 'var(--bg)', color: 'var(--ink)', fontSize: 13.5, fontFamily: 'var(--font-body)', outline: 'none', resize: 'vertical' }} />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 16px' }}>
                {QUICK_REPLIES.map((q) => (
                  <span key={q} onClick={() => setReply(q)} style={{ fontSize: 11.5, padding: '6px 12px', border: '1px solid var(--line-2)', borderRadius: 99, cursor: 'pointer', color: 'var(--ink-2)', background: 'var(--bg)' }}>{q}</span>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button className="btn btn-ghost" style={{ padding: '10px 18px', fontSize: 11 }} onClick={() => openWhatsApp(selected)}>WhatsApp</button>
                <button className="btn btn-primary" style={{ padding: '10px 18px', fontSize: 11 }} onClick={() => sendAndArchive(selected)}>Send &amp; Archive →</button>
              </div>
            </div>
          ) : (
            <div className="msg-detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 14 }}>
              Select a message to read it.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Customers ─────────────────────────────────────────────────
const SLOTS = ['10:00', '11:00', '12:00', '13:00', '14:30', '15:30', '16:30', '17:30', '18:30'];

function CustomersView({ bookings, loading, setTab }) {
  const { toast, confirm } = useSnackbar();
  const [search, setSearch] = React.useState('');
  const [filterTab, setFilterTab] = React.useState('All');

  // Edit / Cancel booking states
  const [editingBooking, setEditingBooking] = React.useState(null);
  const [editingCustomerName, setEditingCustomerName] = React.useState('');
  const [editDate, setEditDate] = React.useState('');
  const [editSlot, setEditSlot] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const handleOpenEditModal = (booking, customerName) => {
    setEditingBooking(booking);
    setEditingCustomerName(customerName);
    setEditDate(booking.date || '');
    setEditSlot(booking.time || '');
  };

  const handleCloseEditModal = () => {
    setEditingBooking(null);
    setEditingCustomerName('');
    setEditDate('');
    setEditSlot('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingBooking?.id || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: editDate, slot: editSlot })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to reschedule booking');
      }
      handleCloseEditModal();
      toast('Booking rescheduled successfully!');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!editingBooking?.id || busy) return;
    const ok = await confirm('Are you sure you want to cancel this booking?');
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/bookings/${editingBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to cancel booking');
      }
      handleCloseEditModal();
      toast('Booking cancelled.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const todayStr = new Date().toDateString();
  const customersMap = {};

  (bookings || []).forEach((b) => {
    const key = (b.phone && b.phone !== '—') ? b.phone : b.name;
    if (!key) return;

    if (!customersMap[key]) {
      customersMap[key] = {
        name: b.name || 'Anonymous',
        phone: (b.phone && b.phone !== '—') ? b.phone : '',
        email: (b.email && b.email !== '—') ? b.email : '',
        bookings: []
      };
    }
    customersMap[key].bookings.push(b);
  });

  const customersList = React.useMemo(() => {
    return Object.values(customersMap).map((c) => {
      // Find if they have a booking today
      const hasBookingToday = c.bookings.some(b => b.date && new Date(b.date).toDateString() === todayStr && b.status !== 'cancelled');
      
      // Sort active bookings to find latest/upcoming one
      const activeBookings = c.bookings.filter(b => b.status !== 'cancelled');
      activeBookings.sort((a, b) => {
        const da = a.date ? new Date(a.date) : new Date(0);
        const db = b.date ? new Date(b.date) : new Date(0);
        return db - da; // newest first
      });

      const now = new Date();
      now.setHours(0,0,0,0);
      const upcoming = activeBookings.find(b => b.date && new Date(b.date) >= now);
      const primaryBooking = upcoming || activeBookings[0] || null;

      // Get favorite/most booked service
      const serviceCounts = {};
      activeBookings.forEach(b => {
        const sName = b.svc || 'Service';
        serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
      });
      const lovesService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

      // Calculate visits and total spent
      const visits = activeBookings.length;
      const spent = activeBookings.reduce((sum, b) => sum + Number(b.price || 0), 0);

      // Get human-readable last visit string
      let lastVisitStr = '—';
      const lastActive = activeBookings[0];
      if (lastActive && lastActive.date) {
        const d = new Date(lastActive.date);
        const diffDays = Math.floor((new Date().setHours(0,0,0,0) - d.setHours(0,0,0,0)) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) lastVisitStr = 'In today';
        else if (diffDays === 1) lastVisitStr = 'Last · Yesterday';
        else lastVisitStr = `Last · ${diffDays} days ago`;
      }

      return {
        name: c.name,
        phone: c.phone,
        email: c.email,
        primaryBooking,
        lovesService,
        visits,
        spent,
        hasBookingToday,
        lastVisitStr,
        isRegular: visits >= 3,
        upcomingDate: upcoming?.date ? new Date(upcoming.date) : null
      };
    });
  }, [bookings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stats calculation
  const totalCustomers = customersList.length;
  const returningCustomers = customersList.filter(c => c.visits >= 2).length;
  const returningRate = totalCustomers > 0 ? Math.round((returningCustomers / totalCustomers) * 100) : 0;
  
  const totalRevenue = (bookings || []).reduce((sum, b) => sum + Number(b.price || 0), 0);
  const avgLifetimeSpend = totalCustomers > 0 ? Math.round(totalRevenue / totalCustomers) : 0;
  const visitingTodayCount = customersList.filter(c => c.hasBookingToday).length;

  const filteredCustomers = React.useMemo(() => {
    return customersList.filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search);
      if (!matchSearch) return false;
      if (filterTab === 'Visiting Today') return c.hasBookingToday;
      if (filterTab === 'Regulars') return c.isRegular;
      return true;
    });
  }, [customersList, search, filterTab]);

  function exportCSV() {
    const rows = [
      ['Customer Name', 'Phone', 'Email', 'Total Visits', 'Coming For', 'Appointment Date', 'Appointment Time'],
      ...customersList.map(c => [
        c.name,
        c.phone,
        c.email,
        c.visits,
        c.primaryBooking?.svc || '—',
        c.primaryBooking?.date ? new Date(c.primaryBooking.date).toLocaleDateString('en-IN') : '—',
        c.primaryBooking?.time || '—'
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <style>{`
        .circular-btn {
          color: var(--ink-2) !important;
          transition: all 0.2s ease !important;
        }
        .circular-btn:hover {
          border-color: var(--ink) !important;
          background: var(--bg-soft) !important;
          color: var(--ink) !important;
        }

        /* Filter bar: search left, controls right on desktop */
        .cust-filterbar { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; }
        .cust-search { position: relative; display: inline-flex; align-items: center; width: 100%; max-width: 360px; }
        .cust-controls { display: flex; align-items: center; gap: 12px; }

        @media (max-width: 560px) {
          /* The cards already look like cards — drop the redundant panel frame
             on mobile so we don't show a card inside a card. */
          .cust-panel { background: transparent !important; border: 0 !important; padding: 0 !important; box-shadow: none !important; }
          /* Search goes full width, then chips+export below on one scrollable line */
          .cust-filterbar { flex-direction: column; align-items: stretch; gap: 12px; }
          .cust-search { max-width: 100%; }
          .cust-controls { width: 100%; flex-wrap: nowrap; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
          .cust-controls::-webkit-scrollbar { display: none; }
          .cust-controls .chip-row { flex-wrap: nowrap; flex-shrink: 0; }
          .cust-controls .btn { flex-shrink: 0; margin-left: auto; }
        }

        /* Customers stat-grid: keep 2 columns on mobile */
        @media (max-width: 768px) {
          .cust-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px !important;
          }
        }
      `}</style>

      {/* Stats Cards Row */}
      <div className="stat-grid cust-stat-grid">
        <div className="stat-card">
          <div className="lbl">Total Customers</div>
          <div className="v">{loading ? '…' : totalCustomers}</div>
          <div className="delta up">▲ Active list</div>
        </div>
        <div className="stat-card">
          <div className="lbl">Returning Rate</div>
          <div className="v">{loading ? '…' : `${returningRate}%`}</div>
          <div className="delta up">▲ 2+ bookings</div>
        </div>
        <div className="stat-card">
          <div className="lbl">Avg. Lifetime Spend</div>
          <div className="v">{loading ? '…' : `₹${avgLifetimeSpend.toLocaleString('en-IN')}`}</div>
          <div className="delta up">▲ Per customer</div>
        </div>
        <div className="stat-card">
          <div className="lbl">Visiting Today</div>
          <div className="v">{loading ? '…' : visitingTodayCount}</div>
          <div className="delta up">▲ Scheduled today</div>
        </div>
      </div>

      {/* Filter & Search Panel */}
      <div className="panel cust-panel" style={{ padding: 24 }}>
        <div className="cust-filterbar">
          {/* Search box */}
          <div className="cust-search">
            <span style={{ position: 'absolute', left: 16, color: 'var(--muted)', pointerEvents: 'none', fontSize: 16 }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers by name..."
              style={{
                width: '100%',
                padding: '10px 16px 10px 44px',
                borderRadius: 24,
                border: '1px solid var(--line-2)',
                background: 'var(--bg)',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              className="search-field"
            />
          </div>

          {/* Filter Tab Chips */}
          <div className="cust-controls">
            <div className="chip-row" style={{ marginBottom: 0, gap: 8, flexWrap: 'nowrap', overflowX: 'auto', maxWidth: '100%' }}>
              {['All', 'Visiting Today', 'Regulars'].map((t) => (
                <span
                  key={t}
                  className={'chip ' + (filterTab === t ? 'active' : '')}
                  onClick={() => setFilterTab(t)}
                  style={{ padding: '8px 16px', fontSize: 11, whiteSpace: 'nowrap' }}
                >
                  {t}
                </span>
              ))}
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 11, padding: '10px 20px', borderRadius: 24, whiteSpace: 'nowrap' }} onClick={exportCSV}>
              Export CSV
            </button>
          </div>
        </div>

        {/* Customer Cards Grid */}
        {loading && <div style={{ color: 'var(--muted)', padding: '48px 0', textAlign: 'center', fontSize: 14 }}>Loading customer catalog…</div>}
        
        {!loading && filteredCustomers.length === 0 && (
          <div style={{ color: 'var(--muted)', padding: '64px 0', textAlign: 'center', fontSize: 14, border: '1px dashed var(--line-2)', borderRadius: 6, marginTop: 20 }}>
            No customers found matching your search.
          </div>
        )}

        {!loading && filteredCustomers.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
            gap: 20,
            marginTop: 24
          }}>
            {filteredCustomers.map((c, idx) => (
              <div key={idx} style={{
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: 24,
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                {/* Header block — avatar + name + edit button */}
                <div style={{ display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', minWidth: 0 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: 'var(--bg-cream)',
                      color: 'var(--gold-deep)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-display)',
                      fontSize: 17,
                      fontWeight: 600,
                      flexShrink: 0
                    }}>
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <h4 style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 18,
                        fontWeight: 500,
                        margin: 0,
                        color: 'var(--ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>{c.name}</h4>
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.lovesService ? `Loves · ${c.lovesService}` : 'New customer'}
                      </div>
                    </div>
                  </div>
                  {/* Edit button in header */}
                  {c.primaryBooking && (
                    <button onClick={() => handleOpenEditModal(c.primaryBooking, c.name)} title="Reschedule or Cancel" style={{
                      height: 32, borderRadius: 16, border: '1px solid var(--line)',
                      padding: '0 14px', fontSize: 11, fontWeight: 600,
                      background: 'var(--bg)', color: 'var(--ink)', cursor: 'pointer',
                      textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0
                    }}>
                      Edit
                    </button>
                  )}
                </div>

                {/* Details Content Box */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  fontSize: 13,
                  padding: '14px 16px',
                  background: 'var(--bg-soft)',
                  borderRadius: 6,
                  border: '1px solid var(--line)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>Coming for:</span>
                    <strong style={{ color: 'var(--ink)', fontWeight: 500, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.primaryBooking?.svc || '—'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>Date &amp; Time:</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 500, textAlign: 'right' }}>
                      {c.primaryBooking?.date ? `${new Date(c.primaryBooking.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · ${c.primaryBooking.time || ''}` : '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>Phone:</span>
                    <span style={{ color: 'var(--ink)', fontWeight: 500, textAlign: 'right' }}>{c.phone || '—'}</span>
                  </div>
                </div>

                {/* Card Footer — status + contact icons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: 4 }}>
                  {/* Status Indicator */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>
                    <span style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: c.hasBookingToday ? '#3a7d44' : c.upcomingDate ? 'var(--gold)' : 'var(--muted)'
                    }} />
                    <span style={{ color: c.hasBookingToday ? '#3a7d44' : c.upcomingDate ? 'var(--gold-deep)' : 'var(--muted)', textTransform: 'uppercase' }}>
                      {c.hasBookingToday ? 'Visiting Today' : c.upcomingDate ? 'Upcoming Appt' : c.lastVisitStr}
                    </span>
                  </div>

                  {/* Contact icon buttons */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {c.phone && (
                      <>
                        <a href={`tel:${c.phone}`} title="Call customer" style={{
                          width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--line)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)'
                        }} className="circular-btn"><IconPhone /></a>
                        <a href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" style={{
                          width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--line)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)'
                        }} className="circular-btn"><IconWa /></a>
                      </>
                    )}
                    <button onClick={() => setTab('appts')} title="View Appointments" style={{
                      width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--line)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', cursor: 'pointer'
                    }} className="circular-btn"><IconCalendar /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Booking Modal ── */}
      {editingBooking && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
          <div style={{ background:'var(--bg)', border:'1px solid var(--line)', borderRadius:8, width:'100%', maxWidth:440, maxHeight: '90vh', overflowY: 'auto', padding:32, boxSizing:'border-box' }} className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:22, margin: 0, color: 'var(--ink)' }}>
                Edit Appointment
              </h3>
              <button type="button" onClick={handleCloseEditModal} style={{
                background: 'var(--bg-soft, #f7f5f0)',
                border: 'none',
                color: 'var(--ink)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}>✕</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Customer</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{editingCustomerName}</div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4 }}>Service</div>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink)' }}>{editingBooking.svc}</div>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
              <div className="field">
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Select Date</label>
                <input 
                  type="date" 
                  required 
                  value={editDate} 
                  onChange={e => setEditDate(e.target.value)} 
                  style={{ 
                    width:'100%', 
                    boxSizing:'border-box',
                    padding: '10px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--line)',
                    background: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 14,
                    outline: 'none'
                  }} 
                />
              </div>

              <div className="field">
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>Select Time Slot</label>
                <select 
                  value={editSlot} 
                  onChange={e => setEditSlot(e.target.value)} 
                  style={{ 
                    width:'100%', 
                    boxSizing:'border-box', 
                    height:40, 
                    padding:'0 10px',
                    borderRadius: 6,
                    border: '1px solid var(--line)',
                    background: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 14,
                    outline: 'none'
                  }}
                >
                  {SLOTS.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 10 }}>
                <button 
                  type="submit" 
                  disabled={busy}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 24,
                    background: 'var(--gold, #9e7f55)',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    transition: 'opacity 0.2s'
                  }}
                >
                  {busy ? 'Saving Changes...' : 'Reschedule Appointment'}
                </button>

                <button 
                  type="button" 
                  onClick={handleCancelBooking}
                  disabled={busy}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: 24,
                    background: 'transparent',
                    color: 'var(--danger, #dc3545)',
                    border: '1px solid var(--danger, #dc3545)',
                    fontWeight: 600,
                    cursor: busy ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    transition: 'all 0.2s'
                  }}
                >
                  Cancel Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Client-side image compression to a small Base64 data URL (~30 KB target).
// Images are stored inline in Firestore documents (1 MB hard limit), so any
// upload — even a 100 MB camera photo — is resized to card resolution and
// encoded as WebP (≈30% smaller than JPEG at the same visual quality, with
// JPEG fallback). Quality steps down gently first; if the target still isn't
// met, the dimensions shrink instead, so the result stays clean, not blocky.
const IMG_TARGET_BYTES = 30 * 1024;

function dataUrlBytes(dataUrl) {
  return Math.ceil((dataUrl.length - dataUrl.indexOf(',') - 1) * 3 / 4);
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file'));
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        // Browsers without WebP encoding silently return a PNG data URL
        const webpOk = canvas.toDataURL('image/webp').startsWith('data:image/webp');
        const mime = webpOk ? 'image/webp' : 'image/jpeg';

        const encodeAt = (maxSide) => {
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          // White backdrop so transparent PNGs don't turn black in JPEG
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          for (const q of [0.8, 0.72, 0.65]) {
            const out = canvas.toDataURL(mime, q);
            if (dataUrlBytes(out) <= IMG_TARGET_BYTES) return out;
          }
          return null; // didn't fit at acceptable quality — try smaller
        };

        // Shrink dimensions before crushing quality; 480px is the floor —
        // past that we accept a slightly larger file to keep cards sharp.
        for (const side of [800, 640, 560, 480]) {
          const out = encodeAt(side);
          if (out) {
            resolve(out);
            return;
          }
        }
        resolve(canvas.toDataURL(mime, 0.6));
      };
      img.onerror = () => reject(new Error('Could not read that image'));
    };
    reader.onerror = (err) => reject(err);
  });
}

// ── Services ──────────────────────────────────────────────────
const DEFAULT_HEROES = [
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=900&q=80', // Makeup
  'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=900&q=80', // Nails
  'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=900&q=80', // Hair
  'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=80', // Skin
  'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=900&q=80', // Bridal
];

const CameraIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

function ServicesView({ services, loading, onRefresh, onPatch }) {
  const { toast, confirm } = useSnackbar();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState(null);
  const [form, setForm] = React.useState({
    name: '',
    cat: 'Bridal',
    customCat: '',
    iconName: 'Bridal',
    price: '',
    duration: '60 min',
    desc: '',
    hero: DEFAULT_HEROES[0],
    available: true
  });
  const [busy, setBusy] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const handleAddClick = () => {
    setEditingService(null);
    setForm({
      name: '',
      cat: 'Bridal',
      customCat: '',
      iconName: 'Bridal',
      price: '',
      duration: '60 min',
      desc: '',
      hero: DEFAULT_HEROES[0],
      available: true
    });
    setModalOpen(true);
  };

  const handleEditClick = (s) => {
    setEditingService(s);
    const isStandardCat = ['Bridal', 'Makeup', 'Hair', 'Skin', 'Nails', 'Waxing', 'Threading', 'Spa', 'Mani', 'Package'].includes(s.cat);
    setForm({
      name: s.name || '',
      cat: isStandardCat ? s.cat : 'Others',
      customCat: isStandardCat ? '' : s.cat,
      iconName: s.icon || s.cat || 'Bridal',
      price: s.price !== null && s.price !== undefined ? String(s.price) : '',
      duration: s.duration || '60 min',
      desc: s.desc || '',
      hero: s.hero || DEFAULT_HEROES[0],
      available: s.available !== false
    });
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingService(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setForm(prev => ({ ...prev, hero: compressed }));
    } catch (err) {
      alert('Error reading/compressing image: ' + err.message);
    }
  };

  const handleToggleVisibility = async (s) => {
    const next = s.available === false;
    onPatch(s.id, { available: next }); // optimistic — no list refetch per click
    try {
      const res = await fetch(`/api/services/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ available: next }),
      });
      if (!res.ok) throw new Error('Failed to update visibility');
    } catch (err) {
      onPatch(s.id, { available: !next }); // roll back on failure
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const finalCat = form.cat === 'Others' ? form.customCat : form.cat;
      const payload = {
        name: form.name,
        cat: finalCat,
        icon: form.iconName,
        price: form.price !== '' ? Number(form.price) : null,
        duration: form.duration,
        desc: form.desc,
        hero: form.hero,
        available: form.available !== false
      };

      if (editingService) {
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update service');
      } else {
        const res = await fetch('/api/services', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to save service');
      }

      setModalOpen(false);
      setEditingService(null);
      onRefresh();
      toast(editingService ? 'Service updated!' : 'Service added!');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Are you sure you want to delete this service?');
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/services/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete service');
      onRefresh();
      toast('Service deleted.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const list = services || [];
  const availableCount = list.filter(s => s.available !== false).length;

  return (
    <div className="panel" style={{ background:'transparent', border:'none', padding:0 }}>
      <div className="panel-head" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <h3 style={{ fontSize: 20, fontWeight: 500, fontFamily: 'var(--font-display)', margin: 0 }}>
          Service Catalog · {loading ? '…' : `${availableCount} of ${list.length} available`}
        </h3>
        <button className="btn btn-primary" onClick={handleAddClick} style={{ padding: '10px 24px', borderRadius: 24 }}>+ Add Service</button>
      </div>

      {loading && <div style={{ color:'var(--muted)', padding:'24px 0', fontSize:14 }}>Loading services catalog…</div>}

      {!loading && (
        <div className="admin-catalog-grid">
          {list.map((s) => {
            const Ic = ICON_MAP[s.icon] || ICON_MAP[s.cat] || IconPackage;
            const isDeleting = deletingId === s.id;
            const heroSrc = s.hero || DEFAULT_HEROES[0];
            return (
              <div key={s.id} style={{
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                opacity: isDeleting ? 0.4 : 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                {/* Image & Tag */}
                <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: 'var(--bg-soft)' }}>
                  <img src={heroSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    background: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(4px)',
                    color: '#fff',
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    padding: '4px 10px',
                    borderRadius: 4,
                    textTransform: 'uppercase'
                  }}>
                    {s.cat}
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 19,
                      fontWeight: 500,
                      margin: 0,
                      color: 'var(--ink)'
                    }}>
                      {s.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleEditClick(s)}
                      style={{
                        background: 'var(--bg-cream)',
                        border: 'none',
                        color: 'var(--gold-deep)',
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      ✎
                    </button>
                  </div>

                  <p style={{
                    fontSize: 13,
                    color: 'var(--muted)',
                    lineHeight: 1.5,
                    margin: '0 0 16px',
                    minHeight: 38,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {s.desc || 'No description provided.'}
                  </p>

                  <div style={{ borderTop: '1px solid var(--line)', margin: 'auto 0 12px', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <IconClock /> {s.duration}
                    </div>
                    <div style={{
                      fontSize: 15,
                      color: 'var(--gold-deep)',
                      fontWeight: 700
                    }}>
                      {s.price !== undefined && s.price !== null && s.price !== '' ? `₹${Number(s.price).toLocaleString('en-IN')}` : 'On request'}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    {/* Toggle switch */}
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={s.available !== false}
                        onChange={() => handleToggleVisibility(s)}
                        style={{ display: 'none' }}
                      />
                      <div style={{
                        width: 34,
                        height: 18,
                        background: s.available !== false ? '#3a7d44' : '#c8bfae',
                        borderRadius: 9,
                        position: 'relative',
                        transition: 'background 0.2s'
                      }}>
                        <div style={{
                          width: 12,
                          height: 12,
                          background: '#fff',
                          borderRadius: '50%',
                          position: 'absolute',
                          top: 3,
                          left: s.available !== false ? 19 : 3,
                          transition: 'left 0.2s'
                        }} />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', color: s.available !== false ? '#3a7d44' : 'var(--muted)' }}>
                        {s.available !== false ? '● AVAILABLE' : '● HIDDEN'}
                      </span>
                    </label>

                    {/* Edit / More pill actions */}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEditClick(s)}
                        style={{
                          background: 'var(--bg)',
                          border: '1px solid var(--line)',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '6px 14px',
                          cursor: 'pointer',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          color: 'var(--ink)'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        title="Delete service"
                        style={{
                          background: 'var(--bg)',
                          border: '1px solid var(--line)',
                          borderRadius: '50%',
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--danger)',
                          flexShrink: 0
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Service Modal ── */}
      {modalOpen && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
          <div style={{ background:'var(--bg)', border:'1px solid var(--line)', borderRadius:8, width:'100%', maxWidth:480, maxHeight: '90vh', overflowY: 'auto', padding:32, boxSizing:'border-box' }} className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:24, margin: 0 }}>
                {editingService ? 'Edit Service' : 'Add Service'}
              </h3>
              <button type="button" onClick={handleClose} style={{
                background: 'var(--bg-soft, #f7f5f0)',
                border: 'none',
                color: 'var(--ink)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* Photo Area */}
              <div className="field">
                <label style={{ display:'block', marginBottom: 8 }}>Photo</label>
                <div style={{ position: 'relative', height: 220, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-soft)', border: '1px solid var(--line)' }}>
                  <img src={form.hero || DEFAULT_HEROES[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <label style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(3px)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.25)',
                    padding: '8px 18px',
                    borderRadius: '24px',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    textTransform: 'uppercase'
                  }}>
                    <CameraIcon />
                    Change Photo
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {/* Preset Thumbnails */}
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  {DEFAULT_HEROES.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setForm(prev => ({ ...prev, hero: url }))}
                      style={{
                        flex: 1,
                        aspectRatio: '1',
                        borderRadius: 4,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: form.hero === url ? '2px solid var(--gold-deep, #9e7f55)' : '2px solid transparent',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>

                {/* Uploaded photos are stored as a long base64 string — show a
                    friendly chip instead of dumping it into the URL box */}
                {(form.hero || '').startsWith('data:') ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10, padding: '8px 12px', background: 'var(--bg-soft)', border: '1px solid var(--line)', borderRadius: 4, fontSize: 12 }}>
                    <span style={{ color: '#3a7d44' }}>✓ Your photo is uploaded &amp; compressed</span>
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, hero: '' }))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, textDecoration: 'underline', padding: 0 }}>Remove</button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={form.hero}
                    onChange={e => setForm(prev => ({ ...prev, hero: e.target.value }))}
                    placeholder="Or paste custom image URL..."
                    style={{ width:'100%', boxSizing:'border-box', marginTop: 10, fontSize: 12 }}
                  />
                )}
              </div>

              {/* Service Name */}
              <div className="field">
                <label>Service Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Bridal Signature" style={{ width:'100%', boxSizing:'border-box' }} />
              </div>

              {/* Category & Duration */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="field">
                  <label>Category</label>
                  <select value={form.cat} onChange={e => {
                    const nextCat = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      cat: nextCat,
                      iconName: nextCat !== 'Others' ? nextCat : prev.iconName
                    }));
                  }} style={{ width:'100%', boxSizing:'border-box', height:38, padding:'0 10px' }}>
                    {['Bridal', 'Makeup', 'Hair', 'Skin', 'Nails', 'Waxing', 'Threading', 'Spa', 'Mani', 'Package', 'Others'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Duration</label>
                  <input type="text" required value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} placeholder="e.g. 60 min, 2 hrs" style={{ width:'100%', boxSizing:'border-box' }} />
                </div>
              </div>

              {/* Custom Category Input (Conditional) */}
              {form.cat === 'Others' && (
                <div className="field">
                  <label>Custom Category Name</label>
                  <input type="text" required value={form.customCat} onChange={e => setForm({...form, customCat: e.target.value})} placeholder="e.g. Mehendi" style={{ width:'100%', boxSizing:'border-box' }} />
                </div>
              )}

              {/* Icon Symbol */}
              <div className="field">
                <label>Icon Symbol</label>
                <select value={form.iconName} onChange={e => setForm({...form, iconName: e.target.value})} style={{ width:'100%', boxSizing:'border-box', height:38, padding:'0 10px' }}>
                  <option value="Bridal">Bridal (✨)</option>
                  <option value="Makeup">Makeup (💄)</option>
                  <option value="Hair">Hair (✂️)</option>
                  <option value="Skin">Skin (🧴)</option>
                  <option value="Nails">Nails (💅)</option>
                  <option value="Waxing">Waxing (🍯)</option>
                  <option value="Threading">Threading (🪡)</option>
                  <option value="Spa">Spa (🕯️)</option>
                  <option value="Mani">Manicure (🧼)</option>
                  <option value="Package">Package (🎁)</option>
                </select>
              </div>

              {/* Price */}
              <div className="field">
                <label>Price (₹)</label>
                <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="e.g. 2500 (optional)" style={{ width:'100%', boxSizing:'border-box' }} />
              </div>

              {/* Description */}
              <div className="field">
                <label>Description</label>
                <textarea rows="3" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="What's included..." style={{ width:'100%', boxSizing:'border-box', padding:10, fontFamily:'inherit', fontSize:13 }} />
              </div>

              {/* Visibility Switch */}
              <div className="field" style={{ borderTop: '1px solid var(--line)', paddingTop: 16, marginTop: 4 }}>
                <label style={{ display: 'block', marginBottom: 8 }}>Visibility on Site</label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.available !== false}
                    onChange={e => setForm({...form, available: e.target.checked})}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    width: 40,
                    height: 22,
                    background: form.available !== false ? '#3a7d44' : '#c8bfae',
                    borderRadius: 11,
                    position: 'relative',
                    transition: 'background 0.2s'
                  }}>
                    <div style={{
                      width: 16,
                      height: 16,
                      background: '#fff',
                      borderRadius: '50%',
                      position: 'absolute',
                      top: 3,
                      left: form.available !== false ? 21 : 3,
                      transition: 'left 0.2s'
                    }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: form.available !== false ? '#3a7d44' : 'var(--muted)' }}>
                    {form.available !== false ? '● AVAILABLE' : '● HIDDEN'}
                  </span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button type="button" className="btn btn-ghost" onClick={handleClose} style={{ flex:1, justifyContent:'center', borderRadius: 24 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex:1, justifyContent:'center', borderRadius: 24 }}>
                  {busy ? 'Saving…' : (editingService ? 'Save Changes' : 'Add Service')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Packages admin ────────────────────────────────────────────
const DEFAULT_PACKAGE_IMAGES = [
  'https://images.unsplash.com/photo-1503236823255-94609f598e71?w=900&q=80',
  'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=900&q=80',
  'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=900&q=80',
];

function PackagesAdminView({ packages, loading, onRefresh }) {
  const { toast, confirm } = useSnackbar();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingPackage, setEditingPackage] = React.useState(null);
  const [form, setForm] = React.useState({
    name: '',
    tag: '',
    desc: '',
    includesText: '',
    price: '',
    original: '',
    img: DEFAULT_PACKAGE_IMAGES[0],
  });
  const [busy, setBusy] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);
  const fileInputRef = React.useRef(null);

  const handleAddClick = () => {
    setEditingPackage(null);
    setForm({
      name: '',
      tag: '',
      desc: '',
      includesText: '',
      price: '',
      original: '',
      img: DEFAULT_PACKAGE_IMAGES[0],
    });
    setModalOpen(true);
  };

  const handleEditClick = (p) => {
    setEditingPackage(p);
    setForm({
      name: p.name || '',
      tag: p.tag || '',
      desc: p.desc || '',
      includesText: Array.isArray(p.includes) ? p.includes.join(', ') : (p.includes || ''),
      price: p.price !== null && p.price !== undefined ? String(p.price) : '',
      original: p.original !== null && p.original !== undefined ? String(p.original) : '',
      img: p.img || DEFAULT_PACKAGE_IMAGES[0],
    });
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingPackage(null);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setForm(prev => ({ ...prev, img: compressed }));
    } catch (err) {
      alert('Error reading/compressing image: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const includesArray = form.includesText
        ? form.includesText.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const payload = {
        name: form.name,
        tag: form.tag,
        desc: form.desc,
        includes: includesArray,
        price: form.price !== '' ? Number(form.price) : null,
        original: form.original !== '' ? Number(form.original) : null,
        img: form.img,
      };

      if (editingPackage) {
        const res = await fetch(`/api/packages/${editingPackage.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update package');
      } else {
        const res = await fetch('/api/packages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to save package');
      }

      setModalOpen(false);
      setEditingPackage(null);
      onRefresh();
      toast(editingPackage ? 'Package updated!' : 'Package added!');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Are you sure you want to delete this package?');
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/packages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete package');
      onRefresh();
      toast('Package deleted.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const list = packages || [];

  return (
    <div className="panel" style={{ background:'transparent', border:'none', padding:0 }}>
      <div className="panel-head" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <h3 style={{ fontSize: 20, fontWeight: 500, fontFamily: 'var(--font-display)', margin: 0 }}>
          Packages Catalog · {loading ? '…' : `${list.length} packages`}
        </h3>
        <button className="btn btn-primary" onClick={handleAddClick} style={{ padding: '10px 24px', borderRadius: 24 }}>+ Add Package</button>
      </div>

      {loading && <div style={{ color:'var(--muted)', padding:'24px 0', fontSize:14 }}>Loading packages catalog…</div>}

      {!loading && (
        <div className="admin-catalog-grid">
          {list.map((p) => {
            const isDeleting = deletingId === p.id;
            const imgSrc = p.img || DEFAULT_PACKAGE_IMAGES[0];
            return (
              <div key={p.id} style={{
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                opacity: isDeleting ? 0.4 : 1,
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}>
                {/* Image & Tag */}
                <div style={{ position: 'relative', height: 180, overflow: 'hidden', background: 'var(--bg-soft)' }}>
                  <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {p.tag && (
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      background: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      padding: '4px 10px',
                      borderRadius: 4,
                      textTransform: 'uppercase'
                    }}>
                      {p.tag}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
                    <h3 style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 19,
                      fontWeight: 500,
                      margin: 0,
                      color: 'var(--ink)'
                    }}>
                      {p.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleEditClick(p)}
                      style={{
                        background: 'var(--bg-cream)',
                        border: 'none',
                        color: 'var(--gold-deep)',
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      ✎
                    </button>
                  </div>

                  <p style={{
                    fontSize: 13,
                    color: 'var(--muted)',
                    lineHeight: 1.5,
                    margin: '0 0 12px',
                    minHeight: 38,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {p.desc || 'No description provided.'}
                  </p>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--ink-2)' }}>
                    {(p.includes || []).map((it, i) => (
                      <li key={i} style={{ display: 'flex', gap: 6, alignItems: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ color: 'var(--gold)', fontSize: 10 }}>✦</span>{it}
                      </li>
                    ))}
                  </ul>

                  <div style={{ borderTop: '1px solid var(--line)', margin: 'auto 0 12px', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Pricing
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                      {p.original && (
                        <span style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'line-through' }}>
                          ₹{Number(p.original).toLocaleString('en-IN')}
                        </span>
                      )}
                      <div style={{
                        fontSize: 15,
                        color: 'var(--gold-deep)',
                        fontWeight: 700
                      }}>
                        {p.price !== undefined && p.price !== null && p.price !== '' ? `₹${Number(p.price).toLocaleString('en-IN')}` : 'On request'}
                      </div>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleEditClick(p)}
                        style={{
                          background: 'var(--bg)',
                          border: '1px solid var(--line)',
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '6px 14px',
                          cursor: 'pointer',
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase',
                          color: 'var(--ink)'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        title="Delete package"
                        style={{
                          background: 'var(--bg)',
                          border: '1px solid var(--line)',
                          borderRadius: '50%',
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          color: 'var(--danger)',
                          flexShrink: 0
                        }}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add / Edit Package Modal ── */}
      {modalOpen && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
          <div style={{ background:'var(--bg)', border:'1px solid var(--line)', borderRadius:8, width:'100%', maxWidth:480, maxHeight: '90vh', overflowY: 'auto', padding:32, boxSizing:'border-box' }} className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontFamily:'var(--font-display)', fontSize:24, margin: 0 }}>
                {editingPackage ? 'Edit Package' : 'Add Package'}
              </h3>
              <button type="button" onClick={handleClose} style={{
                background: 'var(--bg-soft, #f7f5f0)',
                border: 'none',
                color: 'var(--ink)',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 'bold'
              }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* Photo Area */}
              <div className="field">
                <label style={{ display:'block', marginBottom: 8 }}>Photo</label>
                <div style={{ position: 'relative', height: 220, borderRadius: 6, overflow: 'hidden', background: 'var(--bg-soft)', border: '1px solid var(--line)' }}>
                  <img src={form.img || DEFAULT_PACKAGE_IMAGES[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <label style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(0,0,0,0.65)',
                    backdropFilter: 'blur(3px)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.25)',
                    padding: '8px 18px',
                    borderRadius: '24px',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    display: 'inline-flex',
                    alignItems: 'center',
                    textTransform: 'uppercase'
                  }}>
                    <CameraIcon />
                    Change Photo
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {/* Preset Thumbnails */}
                <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                  {DEFAULT_PACKAGE_IMAGES.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => setForm(prev => ({ ...prev, img: url }))}
                      style={{
                        flex: 1,
                        aspectRatio: '1',
                        borderRadius: 4,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: form.img === url ? '2px solid var(--gold-deep, #9e7f55)' : '2px solid transparent',
                        boxSizing: 'border-box',
                        transition: 'border-color 0.2s'
                      }}
                    >
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>

                {/* Uploaded photos are stored as a long base64 string — show a
                    friendly chip instead of dumping it into the URL box */}
                {(form.img || '').startsWith('data:') ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 10, padding: '8px 12px', background: 'var(--bg-soft)', border: '1px solid var(--line)', borderRadius: 4, fontSize: 12 }}>
                    <span style={{ color: '#3a7d44' }}>✓ Your photo is uploaded &amp; compressed</span>
                    <button type="button" onClick={() => setForm(prev => ({ ...prev, img: '' }))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 11, textDecoration: 'underline', padding: 0 }}>Remove</button>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={form.img}
                    onChange={e => setForm(prev => ({ ...prev, img: e.target.value }))}
                    placeholder="Or paste custom image URL..."
                    style={{ width:'100%', boxSizing:'border-box', marginTop: 10, fontSize: 12 }}
                  />
                )}
              </div>

              {/* Package Name */}
              <div className="field">
                <label>Package Name</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Monthly Glow" style={{ width:'100%', boxSizing:'border-box' }} />
              </div>

              {/* Tag */}
              <div className="field">
                <label>Tag (e.g. Bestseller, Self-care)</label>
                <input type="text" value={form.tag} onChange={e => setForm({...form, tag: e.target.value})} placeholder="e.g. Bestseller" style={{ width:'100%', boxSizing:'border-box' }} />
              </div>

              {/* Includes (comma-separated list) */}
              <div className="field">
                <label>Included Services (comma-separated)</label>
                <textarea rows="2" value={form.includesText} onChange={e => setForm({...form, includesText: e.target.value})} placeholder="e.g. Gold Glow Facial, Hair Spa, Mani-Pedi Ritual" style={{ width:'100%', boxSizing:'border-box', padding:10, fontFamily:'inherit', fontSize:13 }} />
              </div>

              {/* Price & Original Price */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div className="field">
                  <label>Price (₹)</label>
                  <input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="e.g. 4500" style={{ width:'100%', boxSizing:'border-box' }} />
                </div>
                <div className="field">
                  <label>Original Price (₹ - optional)</label>
                  <input type="number" value={form.original} onChange={e => setForm({...form, original: e.target.value})} placeholder="e.g. 5800" style={{ width:'100%', boxSizing:'border-box' }} />
                </div>
              </div>

              {/* Description */}
              <div className="field">
                <label>Description</label>
                <textarea rows="3" value={form.desc} onChange={e => setForm({...form, desc: e.target.value})} placeholder="Package summary description..." style={{ width:'100%', boxSizing:'border-box', padding:10, fontFamily:'inherit', fontSize:13 }} />
              </div>

              {/* Footer Buttons */}
              <div style={{ display:'flex', gap:12, marginTop:8 }}>
                <button type="button" className="btn btn-ghost" onClick={handleClose} style={{ flex:1, justifyContent:'center', borderRadius: 24 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex:1, justifyContent:'center', borderRadius: 24 }}>
                  {busy ? 'Saving…' : (editingPackage ? 'Save Changes' : 'Add Package')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Gallery admin ─────────────────────────────────────────────
function GalleryAdminView({ gallery, loading, onRefresh }) {
  const { toast, confirm } = useSnackbar();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [form, setForm] = React.useState({ title: '', cat: 'Bridal', customCat: '', file: null });
  const [busy, setBusy] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.file) return;
    setBusy(true);
    try {
      const base64Src = await compressImage(form.file);
      const finalCat = form.cat === 'Others' ? form.customCat : form.cat;

      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          cat: finalCat,
          src: base64Src,
        }),
      });
      if (!res.ok) throw new Error('Failed to upload image');
      setForm({ title: '', cat: 'Bridal', customCat: '', file: null });
      setModalOpen(false);
      onRefresh();
      toast('Photo uploaded successfully!');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Are you sure you want to delete this photo?');
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete image');
      onRefresh();
      toast('Photo deleted.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const list = gallery || [];

  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Gallery · {loading ? '…' : list.length} images</h3>
        <button className="btn btn-primary" onClick={() => setModalOpen(true)}>+ Upload Photos</button>
      </div>

      {loading && <div style={{ color:'var(--muted)', padding:'24px 0', fontSize:14 }}>Loading lookbook gallery…</div>}

      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:12 }}>
          {list.map((g, i) => {
            const isDeleting = deletingId === g.id;
            return (
              <div key={g.id || i} style={{ aspectRatio:'1', borderRadius:4, overflow:'hidden', position:'relative', opacity: isDeleting ? 0.4 : 1 }}>
                <img src={g.src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'8px 10px', background:'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                  <div>
                    <div style={{ fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase', opacity:0.8 }}>{g.cat}</div>
                    <div style={{ fontSize:11, fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:90 }}>{g.title || 'Untitled'}</div>
                  </div>
                  <button 
                    onClick={() => handleDelete(g.id)}
                    disabled={isDeleting}
                    style={{ background:'rgba(220,50,50,0.8)', border:'none', color:'#fff', borderRadius:3, fontSize:9, cursor:'pointer', padding:'2px 6px', fontWeight:500 }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Upload Photo Modal ── */}
      {modalOpen && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
          <div style={{ background:'var(--bg)', border:'1px solid var(--line)', borderRadius:8, width:'100%', maxWidth:400, padding:32, boxSizing:'border-box' }} className="fade-in">
            <h3 style={{ fontFamily:'var(--font-display)', fontSize:24, marginBottom:24 }}>Upload Photo</h3>
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div className="field">
                <label>Photo Title</label>
                <input type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Sleek Bridal Bun" style={{ width:'100%', boxSizing:'border-box' }} />
              </div>
              <div className="field">
                <label>Category</label>
                <select value={form.cat} onChange={e => setForm({...form, cat: e.target.value})} style={{ width:'100%', boxSizing:'border-box', height:38, padding:'0 10px' }}>
                  {['Bridal', 'Makeup', 'Hair', 'Skin', 'Nails', 'Others'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              {form.cat === 'Others' && (
                <div className="field">
                  <label>Custom Category Name</label>
                  <input type="text" required value={form.customCat} onChange={e => setForm({...form, customCat: e.target.value})} placeholder="e.g. Mehendi" style={{ width:'100%', boxSizing:'border-box' }} />
                </div>
              )}
              <div className="field">
                <label>Select Image File</label>
                <input 
                  type="file" 
                  required 
                  accept="image/*" 
                  onChange={e => setForm({...form, file: e.target.files[0]})} 
                  style={{ width:'100%', boxSizing:'border-box', border:'none', padding:0 }} 
                />
                <small style={{ color:'var(--muted)', fontSize:11, display:'block', marginTop:4 }}>Image will be optimized and saved to your project.</small>
              </div>
              <div style={{ display:'flex', gap:12, marginTop:12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)} style={{ flex:1, justifyContent:'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy || !form.file} style={{ flex:1, justifyContent:'center' }}>
                  {busy ? 'Uploading…' : 'Upload photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reviews (website testimonials) ────────────────────────────
function ReviewsAdminView({ reviews, loading, onRefresh }) {
  const { toast, confirm } = useSnackbar();
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ name: '', role: '', stars: 5, quote: '' });
  const [busy, setBusy] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', role: '', stars: 5, quote: '' });
    setModalOpen(true);
  };
  const openEdit = (r) => {
    setEditing(r);
    setForm({ name: r.name || '', role: r.role || '', stars: r.stars || 5, quote: r.quote || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { name: form.name, role: form.role, stars: Number(form.stars) || 5, quote: form.quote };
      const res = await fetch(editing ? `/api/reviews/${editing.id}` : '/api/reviews', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save review');
      setModalOpen(false);
      setEditing(null);
      onRefresh();
      toast(editing ? 'Review updated!' : 'Review added — it is live on the website.');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Delete this review? It will disappear from the website.');
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete review');
      onRefresh();
      toast('Review deleted.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const list = reviews || [];
  return (
    <div className="panel" style={{ background: 'transparent', border: 'none', padding: 0 }}>
      <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h3 style={{ fontSize: 20, fontWeight: 500, fontFamily: 'var(--font-display)', margin: 0 }}>
          Customer Reviews · {loading ? '…' : `${list.length} on the website`}
        </h3>
        <button className="btn btn-primary" onClick={openAdd} style={{ padding: '10px 24px', borderRadius: 24 }}>+ Add Review</button>
      </div>

      {loading && <div style={{ color: 'var(--muted)', padding: '24px 0', fontSize: 14 }}>Loading reviews…</div>}

      {!loading && list.length === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: 14, padding: '16px 0' }}>
          No reviews yet — the website shows the built-in samples until you add your first one.
        </div>
      )}

      {!loading && list.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {list.map((r) => (
            <div key={r.id} style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 18, opacity: deletingId === r.id ? 0.4 : 1 }}>
              <div style={{ color: 'var(--gold-deep)', letterSpacing: 2, fontSize: 13 }}>
                {'★'.repeat(Math.min(5, Math.max(1, r.stars || 5)))}
                <span style={{ opacity: 0.35 }}>{'★'.repeat(5 - Math.min(5, Math.max(1, r.stars || 5)))}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5, margin: '10px 0 12px' }}>&quot;{r.quote}&quot;</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{r.name}</div>
                  {r.role ? <div style={{ color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{r.role}</div> : null}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" onClick={() => openEdit(r)} style={{ padding: '6px 12px', fontSize: 11 }}>Edit</button>
                  <button className="btn btn-ghost" onClick={() => handleDelete(r.id)} style={{ padding: '6px 12px', fontSize: 11, color: 'var(--danger)' }}><TrashIcon /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 8, width: '100%', maxWidth: 440, padding: 32, boxSizing: 'border-box' }} className="fade-in">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, marginBottom: 24 }}>{editing ? 'Edit Review' : 'Add Review'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="field">
                <label>Customer Name</label>
                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sravanthi R." style={{ width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="field">
                  <label>Tag (optional)</label>
                  <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g. Bride, 2026" style={{ width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div className="field">
                  <label>Stars</label>
                  <select value={form.stars} onChange={(e) => setForm({ ...form, stars: Number(e.target.value) })} style={{ width: '100%', boxSizing: 'border-box', height: 38, padding: '0 10px' }}>
                    {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Feedback</label>
                <textarea required value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} placeholder="What did the customer say?" rows={4} style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex: 1, justifyContent: 'center' }}>
                  {busy ? 'Saving…' : (editing ? 'Save Changes' : 'Add Review')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Analytics ─────────────────────────────────────────────────
function AnalyticsView({ bookings, payments = [] }) {
  const { tweaks } = useAppearance();
  const isDark = tweaks.theme === 'dark';
  const [hoveredIndex, setHoveredIndex] = React.useState(null);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [preset, setPreset] = React.useState('all');

  // Filter bookings and payments timezone-independently using string comparison
  const filteredBookings = React.useMemo(() => {
    return bookings.filter((b) => {
      if (b.status === 'cancelled') return false;
      if (!startDate && !endDate) return true;
      if (!b.date) return false;
      
      const bDate = b.date;
      if (startDate && bDate < startDate) return false;
      if (endDate && bDate > endDate) return false;
      return true;
    });
  }, [bookings, startDate, endDate]);

  const filteredPayments = React.useMemo(() => {
    return payments.filter((p) => {
      if (!startDate && !endDate) return true;
      if (!p.date) return false;
      
      const pDate = p.date;
      if (startDate && pDate < startDate) return false;
      if (endDate && pDate > endDate) return false;
      return true;
    });
  }, [payments, startDate, endDate]);

  const totalBooked = filteredBookings.reduce((s, b) => s + Number(b.price || 0), 0);
  const totalWalkin = filteredPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const total = totalBooked + totalWalkin;

  const bookingsCount = filteredBookings.length;
  const walkinCount = filteredPayments.length;
  const totalTransactions = bookingsCount + walkinCount;

  const handlePresetChange = (val) => {
    setPreset(val);
    const now = new Date();
    if (val === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (val === 'this-month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (val === 'last-30') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (val === 'this-year') {
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      const lastDayOfYear = new Date(now.getFullYear(), 11, 31);
      setStartDate(firstDayOfYear.toISOString().split('T')[0]);
      setEndDate(lastDayOfYear.toISOString().split('T')[0]);
    }
  };

  const clearFilter = () => {
    setPreset('all');
    setStartDate('');
    setEndDate('');
  };

  // Group by month dynamically
  const monthsData = [];
  const now = new Date();
  for (let i = 4; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('en-US', { month: 'short' });
    monthsData.push({
      m: label,
      year: d.getFullYear(),
      monthNum: d.getMonth(),
      v: 0,
      booking: 0,
      walkin: 0
    });
  }

  filteredBookings.forEach((b) => {
    const parts = b.date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthNum = parseInt(parts[1], 10) - 1;
      monthsData.forEach((m) => {
        if (year === m.year && monthNum === m.monthNum) {
          const val = Number(b.price || 0);
          m.booking += val;
          m.v += val;
        }
      });
    }
  });

  filteredPayments.forEach((p) => {
    const parts = p.date.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const monthNum = parseInt(parts[1], 10) - 1;
      monthsData.forEach((m) => {
        if (year === m.year && monthNum === m.monthNum) {
          const val = Number(p.amount || 0);
          m.walkin += val;
          m.v += val;
        }
      });
    }
  });

  const maxV = Math.max(...monthsData.map((m) => m.v), 1000);

  const rangeActive = startDate || endDate;
  const revenueDelta = rangeActive ? '▲ Selected range' : '▲ Live from Firestore';
  const bookingsDelta = rangeActive ? '▲ Selected range' : '▲ All time';
  const confirmedDelta = rangeActive ? '▲ Selected range' : '▲ Active bookings';

  return (
    <>
      <style jsx>{`
        @media (max-width: 560px) {
          .analytics-confirmed-card {
            display: none !important;
          }
          .analytics-custom-filter-card {
            display: flex !important;
            grid-column: span 2;
          }
          .analytics-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px;
          }
        }
      `}</style>

      <div className="stat-grid analytics-stat-grid">
        <div className="stat-card">
          <div className="lbl">Total Revenue</div>
          <div className="v">₹{total.toLocaleString('en-IN')}</div>
          <div className="delta up">{revenueDelta}</div>
        </div>
        
        <div className="stat-card">
          <div className="lbl">Bookings &amp; Walk-ins</div>
          <div className="v">{totalTransactions}</div>
          <div className="delta up">{bookingsDelta}</div>
        </div>

        <div className="stat-card analytics-confirmed-card">
          <div className="lbl">Confirmed</div>
          <div className="v">{filteredBookings.filter(b=>b.status==='confirmed').length}</div>
          <div className="delta up">{confirmedDelta}</div>
        </div>
        
        {/* Custom Date Filter Card replacing Avg. Ticket, moved to the end */}
        <div className="stat-card analytics-custom-filter-card" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="lbl" style={{ margin: 0 }}>Date Filter</div>
            {rangeActive && (
              <button 
                onClick={clearFilter} 
                style={{ 
                  fontSize: 10, 
                  color: 'var(--danger, #b04a4a)', 
                  fontWeight: 700, 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Clear
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>From</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreset('custom');
                }} 
                style={{ 
                  width: '100%', 
                  boxSizing: 'border-box', 
                  padding: '4px 6px', 
                  borderRadius: 4, 
                  border: '1px solid var(--line-2)', 
                  background: 'var(--bg)', 
                  color: 'var(--ink)', 
                  fontSize: 11,
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  colorScheme: isDark ? 'dark' : 'light'
                }} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>To</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreset('custom');
                }} 
                style={{ 
                  width: '100%', 
                  boxSizing: 'border-box', 
                  padding: '4px 6px', 
                  borderRadius: 4, 
                  border: '1px solid var(--line-2)', 
                  background: 'var(--bg)', 
                  color: 'var(--ink)', 
                  fontSize: 11,
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  colorScheme: isDark ? 'dark' : 'light'
                }} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', marginTop: 4 }}>
            <select 
              value={preset} 
              onChange={(e) => handlePresetChange(e.target.value)}
              style={{ 
                width: '100%',
                padding: '4px 6px', 
                borderRadius: 4, 
                border: '1px solid var(--line-2)', 
                background: 'var(--bg)', 
                color: 'var(--ink)', 
                fontSize: 10,
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-30">Last 30 Days</option>
              <option value="this-year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Revenue · Last 5 months</h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', fontSize: 12, fontWeight: 500 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gold-tint)', border: '1px solid var(--line-2)' }} />
              <span style={{ color: 'var(--ink)' }}>Booking</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)' }} />
              <span style={{ color: 'var(--ink)' }}>Walk-in</span>
            </div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:18, alignItems:'end', height:240, marginTop:30 }}>
          {monthsData.map((m, idx) => {
            const hasWalkin = m.walkin > 0;
            const hasBooking = m.booking > 0;
            return (
              <div 
                key={m.m} 
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{ 
                  height:(m.v/maxV*100)+'%', 
                  position:'relative',
                  display: 'flex',
                  flexDirection: 'column-reverse',
                  borderRadius: '3px 3px 0 0',
                  overflow: 'visible',
                  background: 'transparent',
                  cursor: 'pointer'
                }}
              >
                {/* Total label above the bar (fades out on hover) */}
                <div style={{ 
                  position:'absolute', 
                  top:-28, 
                  left:'50%', 
                  transform:'translateX(-50%)', 
                  color:'var(--ink)', 
                  fontSize:13, 
                  fontWeight:600, 
                  whiteSpace:'nowrap',
                  opacity: hoveredIndex === idx ? 0 : 1,
                  transition: 'opacity 0.15s ease'
                }}>
                  ₹{m.v >= 1000 ? `${(m.v/1000).toFixed(1)}K` : m.v}
                </div>

                {/* Stacked segments */}
                {hasBooking && (
                  <div style={{
                    height: (m.booking / m.v * 100) + '%',
                    background: 'var(--gold-tint)',
                    borderTopLeftRadius: !hasWalkin ? '3px' : '0',
                    borderTopRightRadius: !hasWalkin ? '3px' : '0',
                    transition: 'all 0.2s ease',
                  }} />
                )}
                {hasWalkin && (
                  <div style={{
                    height: (m.walkin / m.v * 100) + '%',
                    background: 'var(--success, #4a7a5a)',
                    borderTopLeftRadius: '3px',
                    borderTopRightRadius: '3px',
                    transition: 'all 0.2s ease',
                  }} />
                )}

                {/* Custom breakdown tooltip on hover (in pill format: booking | walkin) */}
                {hoveredIndex === idx && m.v > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: -48,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1a1610',
                    color: '#f1e7d4',
                    border: '1px solid #3b3225',
                    padding: '6px 14px',
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                    zIndex: 100,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    pointerEvents: 'none',
                    animation: 'tooltipFade 0.15s ease-out both'
                  }}>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#d4a875' }} />
                    <span>Booking: ₹{m.booking.toLocaleString('en-IN')}</span>
                    <span style={{ color: 'rgba(241,231,212,0.3)', margin: '0 2px' }}>|</span>
                    <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#88b894' }} />
                    <span>Walk-in: ₹{m.walkin.toLocaleString('en-IN')}</span>
                    {/* Tooltip arrow */}
                    <div style={{
                      position: 'absolute',
                      bottom: -4,
                      left: '50%',
                      transform: 'translateX(-50%) rotate(45deg)',
                      width: 8,
                      height: 8,
                      background: '#1a1610',
                      borderRight: '1px solid #3b3225',
                      borderBottom: '1px solid #3b3225'
                    }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:18, marginTop:10, textAlign:'center', fontSize:11, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--muted)' }}>
          {monthsData.map((m) => <div key={m.m}>{m.m}</div>)}
        </div>
      </div>
    </>
  );
}

// ── Settings ──────────────────────────────────────────────────
function SettingsView({ user }) {
  const { settings, updateSettings, loading } = useSettings();
  const { toast } = useSnackbar();
  const [busy, setBusy] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    phone: '',
    email: '',
    currency: 'INR · ₹',
    address: '',
    hoursText: '',
    openTime: '10:00',
    closeTime: '20:00',
    closedDays: ['Sunday'],
    instagram: '',
    facebook: ''
  });

  React.useEffect(() => {
    if (settings) {
      setForm({
        name: settings.name || '',
        phone: settings.phone || '',
        email: settings.email || '',
        currency: settings.currency || 'INR · ₹',
        address: settings.address || '',
        hoursText: settings.hoursText || 'Mon – Sat · 10am – 8pm, Sun · Closed',
        openTime: settings.openTime || '10:00',
        closeTime: settings.closeTime || '20:00',
        closedDays: settings.closedDays || ['Sunday'],
        instagram: settings.instagram || '',
        facebook: settings.facebook || ''
      });
    }
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await updateSettings(form);
      toast('Studio settings saved successfully!');
    } catch (err) {
      toast(err.message || 'Failed to save settings', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="panel">Loading settings…</div>;
  }

  return (
    <div className="panel">
      <style>{`
        .settings-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 32px;
          margin-top: 12px;
        }
        .settings-grid .field {
          margin-bottom: 0px !important;
          min-width: 0;
        }
        .settings-grid .field input,
        .settings-grid .field select {
          padding: 12px 0 !important;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        @media (max-width: 640px) {
          .settings-grid { grid-template-columns: 1fr; gap: 20px; }
        }
      `}</style>
      <div className="panel-head">
        <h3>Studio Settings</h3>
        <button className="btn btn-primary" style={{ padding:'8px 16px', fontSize:11 }} onClick={handleSave} disabled={busy}>
          {busy ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
      <div className="settings-grid">
        <div className="field">
          <label>Studio name</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="text" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Currency</label>
          <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
            <option value="INR · ₹">INR · ₹</option>
            <option value="USD · $">USD · $</option>
          </select>
        </div>
        <div className="field" style={{ gridColumn:'1 / -1' }}>
          <label>Address</label>
          <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </div>
        <div className="field" style={{ gridColumn:'1 / -1' }}>
          <label>Weekly Hours Text</label>
          <input type="text" value={form.hoursText} onChange={(e) => setForm({ ...form, hoursText: e.target.value })} placeholder="e.g. Mon – Sat · 10am – 8pm, Sun · Closed" />
        </div>
        <div className="field">
          <label>Open Time (24h format)</label>
          <input type="text" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} placeholder="e.g. 10:00" />
        </div>
        <div className="field">
          <label>Close Time (24h format)</label>
          <input type="text" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} placeholder="e.g. 20:00" />
        </div>
        <div className="field" style={{ gridColumn:'1 / -1' }}>
          <label>Closed Days (comma-separated)</label>
          <input type="text" value={form.closedDays.join(', ')} onChange={(e) => setForm({ ...form, closedDays: e.target.value.split(',').map(d => d.trim()).filter(Boolean) })} placeholder="e.g. Sunday" />
        </div>
        <div className="field">
          <label>Instagram URL</label>
          <input type="text" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="https://instagram.com/dmbeauty.medak" />
        </div>
        <div className="field">
          <label>Facebook URL</label>
          <input type="text" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="https://facebook.com/dmbeauty.medak" />
        </div>
      </div>
      {user && (
        <div style={{ marginTop:32, paddingTop:24, borderTop:'1px solid var(--line-2)' }}>
          <div style={{ fontSize:13, color:'var(--muted)', marginBottom:8 }}>Signed in as</div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            {user.photoURL && <img src={user.photoURL} alt="" style={{ width:40, height:40, borderRadius:'50%' }} />}
            <div>
              <div style={{ fontSize:15, fontWeight:600, color: 'var(--ink)' }}>{user.displayName}</div>
              <div style={{ fontSize:13, color:'var(--muted)' }}>{user.email}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Walk-in Cash View ──────────────────────────────────────────
function WalkinCashView({ payments = [], loading, modalOpen, setModalOpen, onRefresh }) {
  const { tweaks } = useAppearance();
  const isDark = tweaks.theme === 'dark';
  const { toast, confirm } = useSnackbar();
  const [activePeriod, setActivePeriod] = React.useState('today');
  const [busy, setBusy] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState(null);
  const [editingPayment, setEditingPayment] = React.useState(null);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [preset, setPreset] = React.useState('all');

  const handlePresetChange = (val) => {
    setPreset(val);
    setActivePeriod('custom');
    const now = new Date();
    if (val === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (val === 'this-month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    } else if (val === 'last-30') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (val === 'this-year') {
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      const lastDayOfYear = new Date(now.getFullYear(), 11, 31);
      setStartDate(firstDayOfYear.toISOString().split('T')[0]);
      setEndDate(lastDayOfYear.toISOString().split('T')[0]);
    }
  };

  const clearFilter = (e) => {
    e.stopPropagation();
    setPreset('all');
    setStartDate('');
    setEndDate('');
    setActivePeriod('custom');
  };

  // Form states
  const [formTitle, setFormTitle] = React.useState('');
  const [formAmount, setFormAmount] = React.useState('');
  const [formDate, setFormDate] = React.useState('');
  const [formTime, setFormTime] = React.useState('');
  const [formPaidBy, setFormPaidBy] = React.useState('Cash');

  // Reset or populate form when modal opens
  React.useEffect(() => {
    if (!modalOpen) {
      setEditingPayment(null);
      return;
    }
    if (editingPayment) {
      setFormTitle(editingPayment.title || '');
      setFormAmount(String(editingPayment.amount ?? ''));
      setFormDate(editingPayment.date || new Date().toISOString().split('T')[0]);
      setFormTime(editingPayment.time || '10:00');
      setFormPaidBy(editingPayment.paidBy || 'Cash');
      return;
    }
    const now = new Date();
    setFormTitle('');
    setFormAmount('');
    setFormDate(now.toISOString().split('T')[0]);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setFormTime(`${hours}:${minutes}`);
    setFormPaidBy('Cash');
  }, [modalOpen, editingPayment]);

  const openEdit = (payment) => {
    setEditingPayment(payment);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formTitle || !formAmount) return;
    setBusy(true);
    const payload = {
      title: formTitle,
      amount: Number(formAmount),
      date: formDate,
      time: formTime,
      paidBy: formPaidBy,
    };
    try {
      const isEdit = !!editingPayment?.id;
      const res = await fetch(
        isEdit ? `/api/payments/${editingPayment.id}` : '/api/payments',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save payment');
      }
      setModalOpen(false);
      onRefresh?.();
      toast(isEdit ? 'Payment updated.' : 'Payment logged successfully!');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm('Delete this walk-in payment? This cannot be undone.');
    if (!ok) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/payments/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete payment');
      onRefresh?.();
      toast('Payment deleted.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Date/Time helper
  const getStartOfWeek = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(date.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const startOfWeek = getStartOfWeek(new Date());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const now = new Date();

  // Filter lists
  const list = payments || [];

  const todayPayments = list.filter((p) => p.date === todayStr);
  const todayTotal = todayPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const weekPayments = list.filter((p) => {
    const pd = new Date(p.date + 'T00:00:00');
    return pd >= startOfWeek && pd <= endOfWeek;
  });
  const weekTotal = weekPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const monthPayments = list.filter((p) => {
    const pd = new Date(p.date + 'T00:00:00');
    return pd.getMonth() === now.getMonth() && pd.getFullYear() === now.getFullYear();
  });
  const monthTotal = monthPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  const customPayments = React.useMemo(() => {
    return list.filter((p) => {
      if (!startDate && !endDate) return true;
      if (!p.date) return false;
      const pDate = p.date;
      if (startDate && pDate < startDate) return false;
      if (endDate && pDate > endDate) return false;
      return true;
    });
  }, [list, startDate, endDate]);
  const customTotal = customPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  // Active list selection
  let filteredPayments = todayPayments;
  let periodLabel = 'TODAY';
  let periodTotal = todayTotal;

  if (activePeriod === 'custom') {
    filteredPayments = customPayments;
    periodLabel = (startDate || endDate) ? 'CUSTOM RANGE' : 'ALL TIME';
    periodTotal = customTotal;
  } else if (activePeriod === 'week') {
    filteredPayments = weekPayments;
    periodLabel = 'THIS WEEK';
    periodTotal = weekTotal;
  } else if (activePeriod === 'month') {
    filteredPayments = monthPayments;
    periodLabel = 'THIS MONTH';
    periodTotal = monthTotal;
  }

  const badgeStyles = {
    Cash: { bg: 'rgba(58,125,68,0.1)', color: '#3a7d44', border: 'rgba(58,125,68,0.2)' },
    UPI:  { bg: 'rgba(140,106,68,0.1)', color: '#8c6a44', border: 'rgba(140,106,68,0.2)' },
    Card: { bg: 'rgba(90,90,220,0.1)', color: '#7986cb', border: 'rgba(90,90,220,0.2)' },
  };

  function formatPaymentDateTime(dateStr, timeStr) {
    let dStr = dateStr;
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        if (!isNaN(dObj.getTime())) {
          dStr = dObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        }
      }
    } catch (e) {}

    let tStr = timeStr;
    try {
      const tParts = timeStr.split(':');
      if (tParts.length === 2) {
        const hrs = Number(tParts[0]);
        const mins = Number(tParts[1]);
        if (!isNaN(hrs) && !isNaN(mins)) {
          const ampm = hrs >= 12 ? 'PM' : 'AM';
          const displayHrs = hrs % 12 || 12;
          const displayMins = String(mins).padStart(2, '0');
          tStr = `${displayHrs}:${displayMins} ${ampm}`;
        }
      }
    } catch (e) {}

    return `${dStr} — ${tStr}`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <style>{`
        .walkin-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 8px;
        }
        .walkin-stat-card {
          background: var(--bg);
          padding: 24px;
          border-radius: 8px;
          border: 1px solid var(--line);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .walkin-stat-card:hover {
          border-color: var(--gold);
        }
        .walkin-stat-card.active {
          border: 1.5px solid var(--gold-deep, #8c6a44);
          background: rgba(140, 106, 68, 0.04);
        }
        .walkin-stat-card .lbl {
          color: var(--muted);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 600;
        }
        .walkin-stat-card .v {
          font-family: inherit;
          font-size: 32px;
          font-weight: 700;
          color: var(--ink);
          line-height: 1.1;
          margin: 12px 0 6px;
        }
        .walkin-stat-card .desc {
          font-size: 12px;
          color: var(--muted);
        }

        .walkin-payments-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 24px;
        }

        .payment-card {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 8px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
        }
        .payment-card .card-index {
          position: absolute;
          top: 24px;
          right: 24px;
          font-size: 13px;
          color: var(--muted);
          opacity: 0.25;
          font-weight: 600;
        }
        .payment-card-actions {
          display: flex;
          gap: 8px;
          margin-top: 4px;
        }
        .payment-card-actions button {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          padding: 6px 14px;
          cursor: pointer;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--ink);
        }
        .payment-card-actions button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .payment-card-actions .payment-delete-btn {
          border-radius: 50%;
          width: 28px;
          height: 28px;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--danger);
        }

        @media (max-width: 1024px) {
          .walkin-stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .walkin-payments-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 560px) {
          .walkin-payments-grid {
            grid-template-columns: 1fr;
          }
          .walkin-stat-card {
            padding: 14px 16px;
          }
          .walkin-stat-card .v {
            font-size: 26px;
            margin: 6px 0 4px;
          }
          .walkin-stat-card .desc {
            font-size: 11px;
          }
          .walkin-week-card {
            display: none !important;
          }
          .walkin-custom-filter-card {
            display: flex !important;
            grid-column: span 2;
          }
          .walkin-stat-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 12px;
          }
        }
      `}</style>

      {/* Top Action Row removed - button is now in main header */}

      <div className="walkin-stat-grid">
        <div className={`walkin-stat-card ${activePeriod === 'today' ? 'active' : ''}`} onClick={() => setActivePeriod('today')}>
          <div className="lbl">Today</div>
          <div className="v">{loading ? '…' : `₹${todayTotal.toLocaleString('en-IN')}`}</div>
          <div className="desc">{loading ? '…' : `${todayPayments.length} ${todayPayments.length === 1 ? 'entry' : 'entries'}`}</div>
        </div>

        <div className={`walkin-stat-card walkin-week-card ${activePeriod === 'week' ? 'active' : ''}`} onClick={() => setActivePeriod('week')}>
          <div className="lbl">This Week</div>
          <div className="v">{loading ? '…' : `₹${weekTotal.toLocaleString('en-IN')}`}</div>
          <div className="desc">{loading ? '…' : `${weekPayments.length} ${weekPayments.length === 1 ? 'entry' : 'entries'}`}</div>
        </div>

        <div className={`walkin-stat-card ${activePeriod === 'month' ? 'active' : ''}`} onClick={() => setActivePeriod('month')}>
          <div className="lbl">This Month</div>
          <div className="v">{loading ? '…' : `₹${monthTotal.toLocaleString('en-IN')}`}</div>
          <div className="desc">{loading ? '…' : `${monthPayments.length} ${monthPayments.length === 1 ? 'entry' : 'entries'}`}</div>
        </div>
        
        {/* Custom Date Filter Card replacing Yesterday, moved to the end */}
        <div 
          className={`walkin-stat-card walkin-custom-filter-card ${activePeriod === 'custom' ? 'active' : ''}`} 
          onClick={() => setActivePeriod('custom')}
          style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '14px 18px', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="lbl" style={{ margin: 0 }}>Date Filter</div>
            {(startDate || endDate) && (
              <button 
                onClick={clearFilter} 
                style={{ 
                  fontSize: 10, 
                  color: 'var(--danger, #b04a4a)', 
                  fontWeight: 700, 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                Clear
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>From</span>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPreset('custom');
                  setActivePeriod('custom');
                }} 
                style={{ 
                  width: '100%', 
                  boxSizing: 'border-box', 
                  padding: '4px 6px', 
                  borderRadius: 4, 
                  border: '1px solid var(--line-2)', 
                  background: 'var(--bg)', 
                  color: 'var(--ink)', 
                  fontSize: 11,
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  colorScheme: isDark ? 'dark' : 'light'
                }} 
              />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600 }}>To</span>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPreset('custom');
                  setActivePeriod('custom');
                }} 
                style={{ 
                  width: '100%', 
                  boxSizing: 'border-box', 
                  padding: '4px 6px', 
                  borderRadius: 4, 
                  border: '1px solid var(--line-2)', 
                  background: 'var(--bg)', 
                  color: 'var(--ink)', 
                  fontSize: 11,
                  fontFamily: 'var(--font-body)',
                  outline: 'none',
                  colorScheme: isDark ? 'dark' : 'light'
                }} 
              />
            </div>
          </div>
          <div style={{ display: 'flex', marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
            <select 
              value={preset} 
              onChange={(e) => handlePresetChange(e.target.value)}
              style={{ 
                width: '100%',
                padding: '4px 6px', 
                borderRadius: 4, 
                border: '1px solid var(--line-2)', 
                background: 'var(--bg)', 
                color: 'var(--ink)', 
                fontSize: 10,
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-30">Last 30 Days</option>
              <option value="this-year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>
      </div>

      {/* Divider and Selected Period Summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--muted)', textTransform: 'uppercase' }}>
          {periodLabel} · {filteredPayments.length} PAYMENT{filteredPayments.length !== 1 ? 'S' : ''}
        </div>
        <div style={{ fontSize: 16, color: 'var(--gold-deep)', fontWeight: 700 }}>
          ₹{periodTotal.toLocaleString('en-IN')} COLLECTED
        </div>
      </div>

      {/* Payments Cards Grid */}
      {loading && <div style={{ color: 'var(--muted)', padding: '48px 0', textAlign: 'center', fontSize: 14 }}>Connecting to database…</div>}
      
      {!loading && filteredPayments.length === 0 && (
        <div style={{ color: 'var(--muted)', padding: '64px 0', textAlign: 'center', fontSize: 14, border: '1px dashed var(--line-2)', borderRadius: 6, marginTop: 24 }}>
          No offline payments logged for this period.
        </div>
      )}

      {!loading && filteredPayments.length > 0 && (
        <div className="walkin-payments-grid">
          {filteredPayments.map((p, idx) => {
            const displayIdx = String(filteredPayments.length - idx).padStart(2, '0');
            const b = badgeStyles[p.paidBy] || badgeStyles.Cash;
            return (
              <div className="payment-card" key={p.id || idx}>
                <div className="card-index">{displayIdx}</div>
                
                {/* Title */}
                <div>
                  <h4 style={{ fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 600, color: 'var(--ink)', margin: 0, paddingRight: 32, lineHeight: 1.3 }}>
                    {p.title}
                  </h4>
                  
                  {/* Time slot with IconClock */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {formatPaymentDateTime(p.date, p.time)}
                  </div>
                </div>

                {/* Price and Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 4 }}>
                  <div style={{ fontSize: 16, color: 'var(--gold-deep)', fontWeight: 700 }}>
                    ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                  </div>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 99,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    background: b.bg,
                    color: b.color,
                    border: `1px solid ${b.border}`
                  }}>{p.paidBy}</span>
                </div>

                <div className="payment-card-actions">
                  <button type="button" onClick={() => openEdit(p)} disabled={deletingId === p.id}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="payment-delete-btn"
                    onClick={() => handleDelete(p.id)}
                    disabled={!p.id || deletingId === p.id}
                    title="Delete payment"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add Payment Modal ── */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, width: '100%', maxWidth: 420, padding: '20px 24px', boxSizing: 'border-box' }} className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, margin: 0, color: 'var(--ink)' }}>
                  {editingPayment ? 'Edit Payment' : 'New Payment'}
                </h3>
                <small style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>Walk-in / Offline Entry</small>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} style={{
                background: 'var(--bg-soft, #f7f5f0)',
                border: 'none',
                color: 'var(--ink)',
                width: 30,
                height: 30,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 'bold'
              }}>✕</button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Title input */}
              <div className="field">
                <label style={{ display: 'block', marginBottom: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Title — For what?</label>
                <input 
                  type="text" 
                  required 
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="e.g. Threading, haircut, facial..." 
                  style={{ 
                    width: '100%', 
                    boxSizing: 'border-box',
                    padding: '9px 12px',
                    borderRadius: 6,
                    border: '1px solid var(--line)',
                    background: 'var(--bg)',
                    color: 'var(--ink)',
                    fontSize: 14,
                    outline: 'none'
                  }} 
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {["Bridal", "Makeup", "Hair", "Skin", "Nails", "Waxing", "Threading", "Spa", "Mani", "Package", "Others"].map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setFormTitle(cat)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 99,
                        fontSize: 11,
                        fontWeight: 600,
                        background: formTitle === cat ? 'var(--gold-deep)' : 'var(--bg-soft)',
                        color: formTitle === cat ? '#fff' : 'var(--ink)',
                        border: `1px solid ${formTitle === cat ? 'var(--gold-deep)' : 'var(--line)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount input */}
              <div className="field">
                <label style={{ display: 'block', marginBottom: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Amount</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <span style={{ position: 'absolute', left: 12, color: 'var(--muted)', fontSize: 14, fontWeight: 500 }}>₹</span>
                  <input 
                    type="number" 
                    required 
                    value={formAmount}
                    onChange={e => setFormAmount(e.target.value)}
                    placeholder="" 
                    style={{ 
                      width: '100%', 
                      boxSizing: 'border-box',
                      padding: '9px 12px 9px 24px',
                      borderRadius: 6,
                      border: '1px solid var(--line)',
                      background: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 14,
                      outline: 'none'
                    }} 
                  />
                </div>
              </div>

              {/* Date & Time inputs side-by-side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="field">
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Date</label>
                  <input 
                    type="date" 
                    required 
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    style={{ 
                      width: '100%', 
                      boxSizing: 'border-box',
                      padding: '9px 12px',
                      borderRadius: 6,
                      border: '1px solid var(--line)',
                      background: 'var(--bg)',
                      color: 'var(--ink)',
                      fontSize: 14,
                      outline: 'none',
                      colorScheme: isDark ? 'dark' : 'light'
                    }} 
                  />
                </div>
                <div className="field">
                  <label style={{ display: 'block', marginBottom: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Time</label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      required 
                      value={formTime}
                      onChange={e => setFormTime(e.target.value)}
                      placeholder="e.g. 15:15"
                      style={{ 
                        width: '100%', 
                        boxSizing: 'border-box',
                        padding: '9px 36px 9px 12px',
                        borderRadius: 6,
                        border: '1px solid var(--line)',
                        background: 'var(--bg)',
                        color: 'var(--ink)',
                        fontSize: 14,
                        outline: 'none'
                      }} 
                    />
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', right: 12, color: 'var(--muted)', pointerEvents: 'none' }}>
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Paid by selection */}
              <div className="field">
                <label style={{ display: 'block', marginBottom: 4, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>Paid By</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[
                    {
                      id: 'Cash',
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                          <rect x="2" y="6" width="20" height="12" rx="2" />
                          <circle cx="12" cy="12" r="2" />
                        </svg>
                      )
                    },
                    {
                      id: 'UPI',
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.58 2.34h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                      )
                    },
                    {
                      id: 'Card',
                      icon: (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
                          <rect x="2" y="5" width="20" height="14" rx="2" />
                          <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                      )
                    }
                  ].map((opt) => {
                    const isSelected = formPaidBy === opt.id;
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => setFormPaidBy(opt.id)}
                        style={{
                          flex: 1,
                          height: 38,
                          borderRadius: 8,
                          border: isSelected ? 'none' : '1px solid var(--line)',
                          background: isSelected ? 'var(--ink)' : 'var(--bg)',
                          color: isSelected ? 'var(--bg)' : 'var(--ink)',
                          fontSize: 13,
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {opt.icon}
                        {opt.id}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions row */}
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)} style={{ flex: 1, justifyContent: 'center', borderRadius: 24, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', height: 40 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={busy} style={{ flex: 1, justifyContent: 'center', borderRadius: 24, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', height: 40 }}>
                  {busy ? 'Saving…' : (editingPayment ? 'Update Payment' : 'Save Payment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
