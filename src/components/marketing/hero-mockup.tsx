export function HeroMockup() {
  return (
    <div className="mk-mockup">
      {/* Floating AI Brief card */}
      <div className="mk-float mk-float-ai">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span className="mk-pill mk-pill-accent" style={{ padding: '3px 8px', fontSize: 9 }}>
            ★ AI BRIEF
          </span>
        </div>
        <div style={{ fontSize: 12, lineHeight: 1.45, color: 'var(--mk-ink-2)', fontWeight: 500 }}>
          Apple beat on Services revenue (+14% YoY) but iPhone sales softened in China.
        </div>
      </div>

      {/* Floating Watchlist card */}
      <div className="mk-float mk-float-wl">
        <div className="mk-eyebrow" style={{ marginBottom: 8 }}>
          WATCHLIST
        </div>
        {(
          [
            ['NVDA', '+2.1%', true],
            ['MSFT', '+0.4%', true],
            ['META', '−0.8%', false],
          ] as const
        ).map(([ticker, delta, up]) => (
          <div
            key={ticker}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '4px 0',
              fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
              fontSize: 11,
            }}
          >
            <span style={{ fontWeight: 600 }}>{ticker}</span>
            <span style={{ color: up ? 'var(--mk-pos)' : 'var(--mk-neg)' }}>{delta}</span>
          </div>
        ))}
      </div>

      <div className="mk-terminal">
        <div className="mk-chrome">
          <span className="mk-chrome-dot" />
          <span className="mk-chrome-dot" />
          <span className="mk-chrome-dot" />
          <div className="mk-url">
            <span style={{ color: 'var(--mk-accent)' }}>●</span>
            moatscape.app/stock/AAPL
          </div>
        </div>
        <div style={{ padding: '18px 18px 16px' }}>
          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: 'linear-gradient(140deg, #1a1a18, #3a3a36)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 700,
                  fontSize: 18,
                  letterSpacing: '-0.02em',
                }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Apple Inc.</div>
                <div
                  className="mk-tabular"
                  style={{
                    fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                    fontSize: 10,
                    color: 'var(--mk-ink-mute)',
                    marginTop: 2,
                  }}
                >
                  AAPL · NASDAQ · USD
                </div>
              </div>
            </div>
            <div>
              <div
                className="mk-tabular"
                style={{ fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', textAlign: 'right' }}
              >
                $228.52
              </div>
              <div
                className="mk-tabular"
                style={{
                  fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                  fontSize: 11,
                  color: 'var(--mk-pos)',
                  display: 'flex',
                  gap: 4,
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  marginTop: 2,
                }}
              >
                ▲ +1.84 (+0.81%)
              </div>
            </div>
          </div>

          {/* Tabs row */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, overflow: 'hidden' }}>
            {['Overview', 'Financials', 'Segments', 'Estimates', 'Ownership', 'News'].map((t, i) => (
              <span
                key={t}
                style={{
                  fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                  fontSize: 10,
                  padding: '5px 10px',
                  borderRadius: 999,
                  color: i === 0 ? 'var(--mk-bg)' : 'var(--mk-ink-soft)',
                  background: i === 0 ? 'var(--mk-ink)' : 'transparent',
                }}
              >
                {t}
              </span>
            ))}
          </div>

          {/* Chart */}
          <div
            style={{
              position: 'relative',
              height: 150,
              borderRadius: 12,
              background: 'linear-gradient(180deg, #faf8f3 0%, #f1eee4 100%)',
              padding: '10px 12px',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: 10,
                top: 8,
                fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                fontSize: 9,
                color: 'var(--mk-ink-mute)',
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
              }}
            >
              <span>250</span>
              <span>200</span>
              <span>150</span>
            </div>
            <svg viewBox="0 0 400 130" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="mk-hero-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1f5340" stopOpacity="0.32" />
                  <stop offset="100%" stopColor="#1f5340" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,100 C30,92 60,78 100,72 C140,66 175,86 215,68 C260,48 295,30 335,22 C365,16 385,32 400,18 L400,130 L0,130 Z"
                fill="url(#mk-hero-area)"
              />
              <path
                d="M0,100 C30,92 60,78 100,72 C140,66 175,86 215,68 C260,48 295,30 335,22 C365,16 385,32 400,18"
                fill="none"
                stroke="#1f5340"
                strokeWidth="1.8"
              />
              <circle cx="335" cy="22" r="4" fill="#1f5340" />
              <circle cx="335" cy="22" r="9" fill="#1f5340" opacity="0.18" />
            </svg>
          </div>

          {/* Range row */}
          <div style={{ display: 'flex', gap: 4, padding: '8px 0 4px' }}>
            {['1D', '1W', '1M', '3M', '1Y', '5Y', '10Y', 'MAX'].map((r, i) => (
              <span
                key={r}
                style={{
                  fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                  fontSize: 10,
                  padding: '3px 8px',
                  color: i === 4 ? 'var(--mk-accent)' : 'var(--mk-ink-mute)',
                  background: i === 4 ? 'var(--mk-accent-soft)' : 'transparent',
                  borderRadius: 5,
                  fontWeight: i === 4 ? 600 : 400,
                }}
              >
                {r}
              </span>
            ))}
          </div>

          {/* Metrics grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginTop: 12,
            }}
          >
            {[
              { l: 'Mkt Cap', v: '$3.41T' },
              { l: 'P/E', v: '34.8' },
              { l: 'EPS', v: '$6.57' },
              { l: 'Div', v: '0.43%' },
            ].map((m) => (
              <div
                key={m.l}
                style={{
                  background: 'var(--mk-bg-warm)',
                  borderRadius: 10,
                  padding: '8px 10px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                    fontSize: 9,
                    color: 'var(--mk-ink-mute)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {m.l}
                </div>
                <div
                  className="mk-tabular"
                  style={{ fontWeight: 700, fontSize: 13, letterSpacing: '-0.01em', marginTop: 2 }}
                >
                  {m.v}
                </div>
              </div>
            ))}
          </div>

          {/* Revenue bars */}
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px dashed var(--mk-line-strong)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span
                style={{
                  fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                  fontSize: 10,
                  color: 'var(--mk-ink-soft)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Revenue · 12Y
              </span>
              <span
                className="mk-tabular"
                style={{
                  fontFamily: 'var(--font-dm-mono), "DM Mono", monospace',
                  fontSize: 10,
                  color: 'var(--mk-pos)',
                }}
              >
                ▲ +8.1% YoY
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 50 }}>
              {[40, 48, 42, 55, 52, 60, 65, 72, 68, 82, 88, 100].map((h, i, a) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    background: 'var(--mk-accent)',
                    opacity: i === a.length - 1 ? 1 : 0.85,
                    borderRadius: '2px 2px 0 0',
                    height: `${h}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
