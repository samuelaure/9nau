import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@9nau/ui'],
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@9nau/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@9nau/ui/lib/utils': path.resolve(__dirname, '../../packages/ui/src/lib/utils'),
      '@9nau/ui/components/button': path.resolve(__dirname, '../../packages/ui/src/components/button'),
      '@9nau/ui/components/card': path.resolve(__dirname, '../../packages/ui/src/components/card'),
      '@9nau/ui/components/input': path.resolve(__dirname, '../../packages/ui/src/components/input'),
    }
    return config
  },
}

export default nextConfig
