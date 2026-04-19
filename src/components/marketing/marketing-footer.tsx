import Link from 'next/link';
import { MarketingLogo } from './logo';

export function MarketingFooter() {
  return (
    <footer style={{ padding: '40px 0 60px', borderTop: '1px solid var(--mk-line)' }}>
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 28px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 18,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MarketingLogo size={22} />
          <span
            className="mk-display"
            style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            moatscape
          </span>
        </div>
        <div className="mk-mono" style={{ fontSize: 11, color: 'var(--mk-ink-mute)' }}>
          © {new Date().getFullYear()} moatscape · Data by Financial Modeling Prep
        </div>
        <div style={{ display: 'flex', gap: 18, fontSize: 13, color: 'var(--mk-ink-soft)' }}>
          <Link href="/#features">Features</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/sign-in">Sign in</Link>
          <Link href="/sign-up">Sign up</Link>
        </div>
      </div>
    </footer>
  );
}
