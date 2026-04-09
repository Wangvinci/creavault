"use client";

import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { cookieStorage, createStorage } from "wagmi";
import { base, baseSepolia, mainnet, optimism } from "wagmi/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "Creavault",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID || "creavault-dev",
  chains: [base, baseSepolia, optimism, mainnet],
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
});
