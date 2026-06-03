import type { NextConfig } from "next";

// Baseline HTTP security headers applied to every response. CSP is intentionally
// not set here — designing one that allows Stripe.js + Supabase realtime + the
// FMP image CDN without unsafe-inline is a separate ticket. These five headers
// are the safe set: no app behavior depends on the absence of any of them.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "financialmodelingprep.com",
      },
      {
        protocol: "https",
        hostname: "images.financialmodelingprep.com",
      },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
