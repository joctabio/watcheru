import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        port: '',
        search: ''
      },
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
        port: '',
        search: ''
      }
    ]
  },
  turbopack: {
    root: path.join(__dirname, '..')
  }
};

export default nextConfig;
