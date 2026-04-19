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
      <div className="mb-6 flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-2.5 text-sm text-green-400">
        <Check className="h-4 w-4 shrink-0" />
        <span>You&apos;re on the waitlist</span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mb-6 flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-text-muted focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={loading}
        className="h-10 shrink-0 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-500 transition-colors disabled:opacity-60"
      >
        {loading ? 'Joining…' : 'Join waitlist'}
      </button>
    </form>
  );
}
