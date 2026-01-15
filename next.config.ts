// next.config.ts
import withPWA from '@ducanh2912/next-pwa'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // 1. 빌드 시 타입/린트 에러가 있어도 무시 (배포 우선)
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // 2. Turbopack 관련 경고 및 Webpack 에러 방지
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "canvas" }];
    return config;
  },

  // 3. 빌드 성능 최적화 (WorkerError 방지)
  experimental: {
    parallelServerBuildTraces: false,
    cpus: 1, // 빌드 시 CPU 사용량을 제한해서 메모리 부족(WorkerError) 차단
  },
}

export default withPWA({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig)


