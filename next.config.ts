import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // output: "export",
  output: "standalone",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
