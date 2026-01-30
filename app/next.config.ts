import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/campaign',
        destination: '/campaigns',
        permanent: true,
      },
      {
        source: '/campaign/:id',
        destination: '/campaigns/:id',
        permanent: true,
      },
      {
        source: '/analytics',
        destination: '/performance',
        permanent: true,
      },
      {
        source: '/strategy/autopsy',
        destination: '/funnels',
        permanent: false, // Temporário enquanto consolidamos a nova rota
      },
    ];
  },
  distDir: '.next',
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
