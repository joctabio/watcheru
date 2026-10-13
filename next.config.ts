import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  webpack: (config, { dev }) => {
    if (dev) config.watchOptions = { ...config.watchOptions, poll: 1000 };
    return config;
  },
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        search: ''
      }
    ]
  },
  turbopack: {
    root: path.resolve(__dirname)
  }
};

export default nextConfig;
