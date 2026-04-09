import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external images from IPFS gateways
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "w3s.link" },
      { protocol: "https", hostname: "**.ipfs.dweb.link" },
      { protocol: "https", hostname: "gateway.pinata.cloud" },
      { protocol: "https", hostname: "arweave.net" },
    ],
  },
  // Silence ethers/siwe CJS warnings from turbopack
  serverExternalPackages: ["ethers", "siwe"],
};

export default nextConfig;
