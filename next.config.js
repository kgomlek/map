const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  disable: process.env.NODE_ENV === 'development',
  workboxOptions: {
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  // Configuration Turbopack pour Next.js 16
  turbopack: {},
  // Utiliser webpack pour le build de production (compatible avec PWA)
  webpack: (config, { isServer }) => {
    return config;
  },
};

module.exports = withPWA(nextConfig);

