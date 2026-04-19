'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

export function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || loading) return;
    setLoading(true);
    try {
      if (typeof window !== 'undefined') {
        const existing = localStorage.getItem('premium_waitlist_emails') ?? '';
        const set = new Set(existing.split(',').filter(Boolean));
        set.add(email);
        localStorage.setItem('premium_waitlist_emails', Array.from(set).join(','));
      }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          borderRadius: 10,
          border: '1px solid #b9d3c8',
          background: 'var(--mk-accent-soft)',
          padding: '10px 14px',
          fontSize: 13,
          color: 'var(--mk-accent)',
          fontWeight: 600,
        }}
      >
        <Check className="h-4 w-4 shrink-0" />
        <span>You&apos;re on the waitlist</span>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        style={{
          height: 42,
          width: '100%',
          borderRadius: 10,
          border: '1px solid var(--mk-line-strong)',
          background: 'var(--mk-paper)',
          padding: '0 14px',
          fontSize: 14,
          color: 'var(--mk-ink)',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
      <button
        type="submit"
        disabled={loading}
        className="mk-btn mk-btn-primary"
        style={{ width: '100%', padding: '13px', fontSize: 14, opacity: loading ? 0.6 : 1 }}
      >
        {loading ? 'Joining…' : 'Join waitlist'}
      </button>
    </form>
  );
}
