'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { CreditCard, LogOut, Star } from 'lucide-react';
import Link from 'next/link';
import type { User as SupabaseUser } from '@supabase/supabase-js';

// Allowlist of OAuth provider hostnames whose avatar URLs we trust to render
// in an <img> tag. user_metadata.avatar_url comes directly from the provider
// and could otherwise be any URL — domain validation prevents arbitrary
// outbound image requests / tracking pixels if an attacker ever influences
// the metadata payload.
const ALLOWED_AVATAR_HOSTS = new Set([
  'lh3.googleusercontent.com',
  'avatars.githubusercontent.com',
]);

function isAllowedAvatarUrl(url: unknown): url is string {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ALLOWED_AVATAR_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

export function UserMenu() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, [supabase]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (!user) return null;

  const initials = (user.email ?? '?')[0].toUpperCase();
  const avatarUrl = isAllowedAvatarUrl(user.user_metadata?.avatar_url)
    ? user.user_metadata.avatar_url
    : null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- using raw <img> intentionally to avoid widening next.config.ts remotePatterns to OAuth provider domains; URL is validated against ALLOWED_AVATAR_HOSTS above
          <img
            src={avatarUrl}
            alt=""
            className="h-8 w-8 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-lg border border-border bg-surface shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="text-sm font-medium text-foreground truncate">
              {user.user_metadata?.full_name ?? user.email}
            </p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/watchlist"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-foreground transition-colors"
            >
              <Star className="h-4 w-4" />
              Watchlist
            </Link>
            <Link
              href="/billing"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-foreground transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Billing
            </Link>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-text-secondary hover:bg-surface-hover hover:text-foreground transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
