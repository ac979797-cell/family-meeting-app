// next.config.ts
import withPWA from '@ducanh2912/next-pwa'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 빌드 시 타입스크립트 에러가 있어도 무시하고 진행
  typescript: {
    ignoreBuildErrors: true,
  },
  // 빌드 시 린트(코드 스타일) 에러가 있어도 무시하고 진행
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default withPWA({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)


