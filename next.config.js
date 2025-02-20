/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {}, // Ensure this is an object, not a boolean
  },
  serverExternalPackages: ['mongoose'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: 'static-assets-web.flixcart.com',
      },
    ],
    domains: ['m.media-amazon.com', 'static-assets-web.flixcart.com','rukminim1.flixcart.com', 'rukminim2.flixcart.com'],
    unoptimized: true,
  },
};

module.exports = nextConfig;