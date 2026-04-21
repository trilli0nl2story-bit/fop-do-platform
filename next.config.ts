import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow the Replit preview proxy to receive HMR updates in development.
  // The exact subdomain changes per Repl; the wildcard covers all Replit dev domains.
  allowedDevOrigins: ['*.spock.replit.dev', '*.replit.dev'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: "base-uri 'self'; form-action 'self'; frame-ancestors 'self'; object-src 'none'" },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
