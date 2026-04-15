import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow the Replit preview proxy to receive HMR updates in development.
  // The exact subdomain changes per Repl; the wildcard covers all Replit dev domains.
  allowedDevOrigins: ['*.spock.replit.dev', '*.replit.dev'],
};

export default nextConfig;
