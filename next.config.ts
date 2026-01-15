import withPWAInit from '@ducanh2912/next-pwa';
import type { NextConfig } from 'next';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  // 1. 핵심: 터보팩 엔진에게 빈 설정을 주어 웹팩 충돌 에러를 해결합니다.
  turbopack: {}, 

  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
  },
  experimental: {
    cpus: 1,
    workerThreads: false,
  },
};

export default withPWA(nextConfig);