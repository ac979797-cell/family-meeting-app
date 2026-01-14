/** @type {import('next').NextConfig} */
const nextConfig = {
  // 에러 메시지에서 권장한 설정 추가
  experimental: {
    turbopack: {}, 
  },
  // 빌드 시 메모리 부하를 줄이기 위한 추가 옵션 (선택)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;