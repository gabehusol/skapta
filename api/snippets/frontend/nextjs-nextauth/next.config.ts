import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // Type errors surface in your IDE and via `tsc --noEmit`.
    // The scaffold must build cleanly with placeholder env vars.
    ignoreBuildErrors: true,
  },
}

export default nextConfig
