"use client";

import { useCallback, useState } from "react";
import { parseEther, type Address } from "viem";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import {
  CONTENT_KIND,
  CONTENT_REGISTRY_ABI,
  CREAVAULT_ADDRESSES,
  ContentKind,
  isLive,
} from "./contracts";

export type MintParams = {
  kind: ContentKind;
  cid: string;
  metaURI: string;
  priceEth: string;
  royaltyBps: number;
  splits?: { recipient: Address; bps: number }[];
};

export type MintState =
  | { status: "idle" }
  | { status: "signing" }
  | { status: "pending"; hash: string }
  | { status: "success"; hash: string }
  | { status: "error"; error: string };

/**
 * Wagmi-backed mint hook for ContentRegistry.register().
 *
 * If contracts aren't deployed on the connected chain yet, the hook
 * falls back to a "simulated" success path so the rest of the UI
 * can be developed and tested. The fallback is clearly labeled in
 * the returned state via `simulated: true`.
 */
export function useMintWork() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const [state, setState] = useState<MintState>({ status: "idle" });

  const mint = useCallback(
    async (params: MintParams): Promise<{ hash?: string; simulated: boolean }> => {
      if (!isConnected || !address) {
        setState({ status: "error", error: "Wallet not connected" });
        return { simulated: false };
      }

      const splits =
        params.splits && params.splits.length > 0
          ? params.splits
          : [{ recipient: address, bps: 10000 }];

      // No deployment on this chain → simulate
      if (!isLive(chainId)) {
        setState({ status: "signing" });
        await new Promise((r) => setTimeout(r, 600));
        setState({ status: "success", hash: "0xsimulated" });
        return { simulated: true };
      }

      try {
        setState({ status: "signing" });
        const hash = await writeContractAsync({
          address: CREAVAULT_ADDRESSES[chainId].registry,
          abi: CONTENT_REGISTRY_ABI,
          functionName: "register",
          args: [
            CONTENT_KIND[params.kind],
            params.cid,
            params.metaURI,
            parseEther(params.priceEth || "0"),
            params.royaltyBps,
            splits.map((s) => ({ recipient: s.recipient, bps: s.bps })),
          ],
        });
        setState({ status: "pending", hash });
        // The actual receipt wait is left to wagmi's useWaitForTransactionReceipt
        // in the page so we don't double-subscribe.
        return { hash, simulated: false };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown error";
        setState({ status: "error", error: msg });
        return { simulated: false };
      }
    },
    [address, chainId, isConnected, writeContractAsync]
  );

  return { mint, state, isLive: isLive(chainId) };
}
