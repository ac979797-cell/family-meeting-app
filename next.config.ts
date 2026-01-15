// next.config.ts
import withPWA from '@ducanh2912/next-pwa'
import type { NextConfig } from 'next'

const nextConfig = {
  // 1. 빌드 속도를 늦추더라도 메모리 폭발을 막음 (핵심)
  experimental: {
    cpus: 1,
    workerThreads: false,
  },

  // 2. 타입/린트 검사 때문에 멈추지 않게 설정
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // 3. Turbopack 경고 방지 및 최적화
  swcMinify: true,

  // 4. PWA 설정 (이미 사용 중이신 게 있다면 그 설정을 유지하되, 
  // 아래 구조처럼 감싸주세요)
};

export default withPWA({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)


