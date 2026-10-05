import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

import { securityHeaders } from './src/lib/security-headers'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // the Open Graph route loads the Bangla font files from node_modules at runtime
  outputFileTracingIncludes: {
    '/og': ['./node_modules/@expo-google-fonts/noto-serif-bengali/{600SemiBold,700Bold}/*.ttf'],
  },
  // any next/image goes through Cloudflare (or the original file), never Vercel's optimizer and its quota
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders() },
      // the service worker must never be served stale, or a broken deploy could stick around
      {
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
