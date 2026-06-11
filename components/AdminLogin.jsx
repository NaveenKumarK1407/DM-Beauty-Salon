'use client';
// Admin login — single-user, email + password only.
// "Forgot password" sends a Firebase password-reset email.
import React from 'react';
import { getClientAuth } from '@/lib/firebaseClient';

export function AdminLogin({ onSignedIn }) {
  const [email,    setEmail]    = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw,   setShowPw]   = React.useState(false);
  const [loading,  setLoading]  = React.useState(false);
  const [error,    setError]    = React.useState(null);

  // Forgot-password state
  const [forgotMode,  setForgotMode]  = React.useState(false);
  const [resetSent,   setResetSent]   = React.useState(false);
  const [resetBusy,   setResetBusy]   = React.useState(false);

  // ── Sign in ─────────────────────────────────────────────────
  async function handleSignIn(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const auth = await getClientAuth();
      if (!auth) throw new Error('Firebase not configured');
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const result = await signInWithEmailAndPassword(auth, email, password);
      onSignedIn(result.user);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Forgot password ──────────────────────────────────────────
  async function handleForgotPassword(e) {
    e.preventDefault();
    if (!email) { setError('Enter your email address first.'); return; }
    setResetBusy(true);
    setError(null);
    try {
      const auth = await getClientAuth();
      if (!auth) throw new Error('Firebase not configured');
      const { sendPasswordResetEmail } = await import('firebase/auth');
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setResetBusy(false);
    }
  }

  function friendlyError(err) {
    const map = {
      'auth/user-not-found':          'No account found with this email.',
      'auth/wrong-password':          'Incorrect password. Try again.',
      'auth/invalid-email':           'Please enter a valid email address.',
      'auth/too-many-requests':       'Too many attempts — wait a moment or reset your password.',
      'auth/invalid-credential':      'Email or password is incorrect.',
      'auth/configuration-not-found': 'Firebase Auth not enabled — go to Firebase Console → Authentication → Sign-in method → Enable Email/Password.',
      'auth/network-request-failed':  'Network error. Check your connection.',
    };
    return map[err.code] || err.message || 'Something went wrong.';
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      fontFamily: 'var(--font-body)',
      padding: '24px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: '52px 44px',
        background: 'var(--bg-soft)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        textAlign: 'center',
      }}>

        {/* Logo */}
        <div style={{ fontFamily:'var(--font-display)', fontSize:28, letterSpacing:'0.04em', color:'var(--ink)' }}>
          DM Beauty
        </div>
        <div style={{ fontSize:11, letterSpacing:'0.2em', textTransform:'uppercase', color:'var(--muted)', marginBottom:36 }}>
          Studio Admin
        </div>

        {/* Lock icon */}
        <div style={{ width:60, height:60, borderRadius:'50%', background:'var(--gold-tint)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 28px', color:'var(--gold-deep)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>

        {/* ══ RESET SENT CONFIRMATION ══ */}
        {resetSent ? (
          <div style={{ textAlign:'center' }}>
            <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--gold-tint)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px', color:'var(--gold-deep)' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7"/>
              </svg>
            </div>
            <h2 style={{ fontSize:20, color:'var(--ink)', marginBottom:12 }}>Check your email</h2>
            <p style={{ color:'var(--muted)', fontSize:14, lineHeight:1.6 }}>
              A password reset link has been sent to<br/>
              <strong style={{ color:'var(--ink)' }}>{email}</strong>.<br/>
              Check your inbox (and spam folder).
            </p>
            <button
              onClick={() => { setResetSent(false); setForgotMode(false); setError(null); }}
              style={{ marginTop:28, fontSize:13, color:'var(--gold-deep)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}
            >
              Back to sign in
            </button>
          </div>

        ) : forgotMode ? (
          /* ══ FORGOT PASSWORD FORM ══ */
          <form onSubmit={handleForgotPassword} style={{ textAlign:'left' }}>
            <h2 style={{ fontSize:20, color:'var(--ink)', marginBottom:8, textAlign:'center' }}>Reset Password</h2>
            <p style={{ color:'var(--muted)', fontSize:13, marginBottom:24, textAlign:'center', lineHeight:1.5 }}>
              Enter your admin email. We'll send a reset link to your inbox.
            </p>

            <div className="field" style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', display:'block', marginBottom:6 }}>
                Email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ width:'100%', boxSizing:'border-box' }}
              />
            </div>

            <button
              type="submit"
              disabled={resetBusy || !email}
              className="btn btn-primary"
              style={{ width:'100%', justifyContent:'center', opacity: (resetBusy || !email) ? 0.5 : 1 }}
            >
              {resetBusy ? 'Sending…' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => { setForgotMode(false); setError(null); }}
              style={{ width:'100%', marginTop:12, fontSize:13, color:'var(--muted)', textAlign:'center', background:'none', border:'none', cursor:'pointer', padding:'8px 0' }}
            >
              ← Back to sign in
            </button>
          </form>

        ) : (
          /* ══ SIGN IN FORM ══ */
          <form onSubmit={handleSignIn} style={{ textAlign:'left' }}>
            <div className="field" style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', display:'block', marginBottom:6 }}>
                Email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                style={{ width:'100%', boxSizing:'border-box' }}
              />
            </div>

            <div className="field" style={{ marginBottom:8 }}>
              <label style={{ fontSize:12, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--muted)', display:'block', marginBottom:6 }}>
                Password
              </label>
              <div style={{ position:'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width:'100%', boxSizing:'border-box', paddingRight:52 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', fontSize:12, color:'var(--muted)', background:'none', border:'none', cursor:'pointer', padding:0 }}
                >
                  {showPw ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Forgot password link */}
            <div style={{ textAlign:'right', marginBottom:24 }}>
              <button
                type="button"
                onClick={() => { setForgotMode(true); setError(null); }}
                style={{ fontSize:12, color:'var(--gold-deep)', background:'none', border:'none', cursor:'pointer', padding:0, textDecoration:'underline' }}
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn btn-primary"
              style={{ width:'100%', justifyContent:'center', opacity:(loading || !email || !password) ? 0.5 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Error */}
        {error && !resetSent && (
          <div style={{ marginTop:20, color:'var(--danger)', fontSize:13, background:'rgba(220,50,50,0.06)', padding:'12px 14px', borderRadius:6, textAlign:'left', lineHeight:1.5 }}>
            ⚠ {error}
          </div>
        )}

        <p style={{ marginTop:28, color:'var(--muted)', fontSize:12 }}>
          Studio owner access only.
        </p>
      </div>
    </div>
  );
}
