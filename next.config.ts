import type { NextConfig } from "next";
module.exports = {
  allowedDevOrigins: ['192.168.100.112'],
}
const nextConfig: NextConfig = {
  /* config options here */
    images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
    ],
  },
};

export default nextConfig;
