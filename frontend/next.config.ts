import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Docker コンテナ内でのファイル変更検知
  output: 'standalone',

  images: {
    // Google OAuth のアバター画像ドメインを許可
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
}

export default nextConfig
