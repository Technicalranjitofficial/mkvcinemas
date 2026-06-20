import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained output folder — required for Docker deployment
  output: 'standalone',

  // ── Image optimisation ──────────────────────────────────────────────────
  images: {
    // AVIF → WebP → original fallback (AVIF is 30–50 % smaller than WebP)
    formats: ['image/avif', 'image/webp'],
    // Responsive breakpoints used by next/image `sizes`
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [32, 64, 96, 128, 256, 384],
    // Cache optimised images on CDN/edge for 24 hours
    minimumCacheTTL: 86400,
    // Allow any HTTPS poster URL (TMDB, custom CDN, etc.)
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
      { protocol: 'https', hostname: '**.tmdb.org' },
      { protocol: 'https', hostname: 'm.media-amazon.com' },
      // Wildcard: allows admin-entered URLs from any https host
      { protocol: 'https', hostname: '**' },
      { protocol: 'http',  hostname: '**' },
    ],
  },

  // Enable gzip / brotli compression
  compress: true,

  // Reduce bundle size with tree-shaking for icon libraries
  experimental: {
    optimizePackageImports: ['lucide-react'],
    // Client-side router cache: disable dynamic on dev, set static to minimum 30s
    staleTimes: {
      dynamic: process.env.NODE_ENV === 'development' ? 0 : 30,
      static: process.env.NODE_ENV === 'development' ? 30 : 180,
    },
  },

  // ── HTTP caching + security headers ─────────────────────────────────────
  async headers() {
    return [
      // Immutable long-term cache for JS/CSS build artifacts
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      // Optimised images cached 7 days, stale-while-revalidate 30 days
      {
        source: '/_next/image(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=2592000' },
        ],
      },
      // Security + popup-blocking headers on every page
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',       value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'fullscreen=*, accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
