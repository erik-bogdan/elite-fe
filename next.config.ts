import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'elitebeerpong.hu',
      },
      {
        protocol: 'https',
        hostname: 'elite.sorpingpong.hu',
      },
    ],
  },
};

export default nextConfig;
