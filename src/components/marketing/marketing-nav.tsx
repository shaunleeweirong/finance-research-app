import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { UserMenu } from '@/components/auth/user-menu';
import { MarketingLogo } from './logo';

export function MarketingNav({ isAuthenticated }: { isAuthenticated: boolean }) {
  return (
    <nav
      className="mk-nav"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        borderBottom: '1px solid var(--mk-line)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 28px',
        }}
      >
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MarketingLogo />
          <span
            className="mk-display"
            style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            moatscape
          </span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Link
            href="/#features"
            className="mk-hide-sm"
            style={{ padding: '8px 14px', fontSize: 14, color: 'var(--mk-ink-soft)' }}
          >
            Features
          </Link>
          <Link
            href="/#tour"
            className="mk-hide-sm"
            style={{ padding: '8px 14px', fontSize: 14, color: 'var(--mk-ink-soft)' }}
          >
            Product
          </Link>
          <Link
            href="/pricing"
            className="mk-hide-sm"
            style={{ padding: '8px 14px', fontSize: 14, color: 'var(--mk-ink-soft)' }}
          >
            Pricing
          </Link>
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Link
                href="/sign-in"
                className="mk-btn mk-btn-ghost mk-hide-sm"
                style={{ padding: '8px 14px', fontSize: 14 }}
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="mk-btn mk-btn-primary"
                style={{ padding: '9px 16px', fontSize: 13 }}
              >
                Start free <ArrowRight className="h-3.5 w-3.5" style={{ opacity: 0.7 }} />
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
