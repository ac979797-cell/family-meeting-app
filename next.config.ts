import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development", // 개발 모드에선 끔
});

const nextConfig: NextConfig = {
  // 에러 메시지가 요청한 터보팩 설정을 명시적으로 추가
  experimental: {
  },
};

export default withPWA(nextConfig);