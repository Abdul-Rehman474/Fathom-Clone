import type { NextConfig } from 'next';

const securityHeaders = [
  // No other site may frame the app (clickjacking on delete, share, send bot).
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Share links carry their token in the path; send only the origin elsewhere.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Camera and microphone are left to the browser's own prompt: screen
  // recorders such as the Loom extension embed their camera bubble in the page.
  { key: 'Permissions-Policy', value: 'geolocation=(), payment=(), usb=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
