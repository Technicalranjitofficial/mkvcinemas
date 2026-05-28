import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimize images
  images: {
    formats: ['image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Enable compression
  compress: true,

  // Reduce bundle size
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // Security headers — blocks ads/popups from iframes and third-party scripts
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            // Prevent iframes on this page from navigating the top-level window
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            // Disable browser features commonly abused by ad scripts
            key: 'Permissions-Policy',
            value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=(), interest-cohort=()',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
