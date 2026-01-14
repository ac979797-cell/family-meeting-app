import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swMinify: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
  },
});

const nextConfig: NextConfig = {
  // 에러 메시지에서 제안한 대로 빈 설정을 추가해 빌드 도구 충돌을 방지합니다.
  experimental: {
    // turbopack 관련 오류 방지
  },
  // 만약 webpack 설정 관련 에러가 지속되면 아래를 추가할 수 있습니다.
};

export default withPWA(nextConfig);