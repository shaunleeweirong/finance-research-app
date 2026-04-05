import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "financialmodelingprep.com",
      },
      {
        protocol: "https",
        hostname: "images.financialmodelingprep.com",
      },
    ],
  },
};

export default nextConfig;
