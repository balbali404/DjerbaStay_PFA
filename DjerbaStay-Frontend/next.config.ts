import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.ngrok-free.app",
        pathname: "/public/images/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "/public/images/**",
      },
    ],
  },
};

export default nextConfig;