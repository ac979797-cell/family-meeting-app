import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  // Turbopack 관련 경고를 무시하고 호환성을 높이는 설정
  transpilePackages: ["@ducanh2912/next-pwa"], 
  experimental: {
    turbo: {
      // 에러 메시지에서 제안한 빈 설정
    },
  },
};

export default withPWA(nextConfig);