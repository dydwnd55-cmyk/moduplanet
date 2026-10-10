import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🚀 Cloudflare Pages 정적 웹사이트 배포 필수 설정
  output: "export",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  /* 기존 프로젝트 옵션 유지 */
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;