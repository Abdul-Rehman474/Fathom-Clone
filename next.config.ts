import type { NextConfig } from 'next';

const securityHeaders = [
  // No other site may frame the app (clickjacking on delete, share, send bot).
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Share links carry their token in the path; send only the origin elsewhere.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Tab capture and the mic meter need these on our own origin only.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), display-capture=(self), geolocation=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
