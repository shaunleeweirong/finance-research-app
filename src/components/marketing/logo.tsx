export function MarketingLogo({ size = 26 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="mk-logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1f5340" />
          <stop offset="1" stopColor="#0e0e0c" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#mk-logo-grad)" />
      <path
        d="M7 22 L12 14 L16 18 L20 10 L25 22"
        fill="none"
        stroke="#efeeeb"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="20" cy="10" r="1.8" fill="#efeeeb" />
    </svg>
  );
}
