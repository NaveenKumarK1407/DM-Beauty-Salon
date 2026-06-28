'use client';

export default function Error({ error, reset }) {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px 24px',
      fontFamily: 'var(--font-body, system-ui, sans-serif)',
      textAlign: 'center',
    }}>
      <h1 style={{
        fontFamily: 'var(--font-display, Georgia, serif)',
        fontSize: 32,
        fontWeight: 500,
        margin: '0 0 12px',
      }}>
        Something went wrong
      </h1>
      <p style={{ color: 'var(--muted, #666)', maxWidth: 420, margin: '0 0 24px', lineHeight: 1.6 }}>
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="btn btn-primary"
        style={{ cursor: 'pointer' }}
      >
        Try again
      </button>
    </div>
  );
}
