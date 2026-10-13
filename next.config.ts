import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
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
