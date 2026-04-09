/**
 * Contract addresses + ABIs for Creavault.
 *
 * Until contracts are deployed, the addresses are zero and the
 * frontend should treat any on-chain action as a "soon" stub.
 * The ABIs are hand-curated subsets — only the functions/events
 * the frontend actually calls. Regenerate from artifacts after
 * the first real deploy.
 */

import type { Address } from "viem";
import { base, baseSepolia } from "wagmi/chains";

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

export const CREAVAULT_ADDRESSES: Record<
  number,
  { registry: Address; receipts: Address }
> = {
  [base.id]: { registry: ZERO_ADDRESS, receipts: ZERO_ADDRESS },
  [baseSepolia.id]: { registry: ZERO_ADDRESS, receipts: ZERO_ADDRESS },
};

export const CONTENT_REGISTRY_ABI = [
  {
    type: "function",
    name: "register",
    stateMutability: "nonpayable",
    inputs: [
      { name: "kind", type: "uint8" },
      { name: "cid", type: "string" },
      { name: "metaURI", type: "string" },
      { name: "priceWei", type: "uint96" },
      { name: "royaltyBps", type: "uint16" },
      {
        name: "splits",
        type: "tuple[]",
        components: [
          { name: "recipient", type: "address" },
          { name: "bps", type: "uint16" },
        ],
      },
    ],
    outputs: [{ name: "workId", type: "uint256" }],
  },
  {
    type: "function",
    name: "collect",
    stateMutability: "payable",
    inputs: [{ name: "workId", type: "uint256" }],
    outputs: [{ name: "receiptId", type: "uint256" }],
  },
  {
    type: "function",
    name: "workOf",
    stateMutability: "view",
    inputs: [{ name: "workId", type: "uint256" }],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "creator", type: "address" },
          { name: "kind", type: "uint8" },
          { name: "priceWei", type: "uint96" },
          { name: "royaltyBps", type: "uint16" },
          { name: "createdAt", type: "uint64" },
          { name: "cidHash", type: "bytes32" },
          { name: "cid", type: "string" },
          { name: "metaURI", type: "string" },
        ],
      },
    ],
  },
  {
    type: "event",
    name: "WorkRegistered",
    inputs: [
      { name: "workId", type: "uint256", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "kind", type: "uint8", indexed: true },
      { name: "cid", type: "string" },
      { name: "priceWei", type: "uint96" },
      { name: "royaltyBps", type: "uint16" },
    ],
  },
  {
    type: "event",
    name: "WorkCollected",
    inputs: [
      { name: "workId", type: "uint256", indexed: true },
      { name: "collector", type: "address", indexed: true },
      { name: "receiptId", type: "uint256" },
      { name: "pricePaid", type: "uint96" },
      { name: "protocolFee", type: "uint96" },
    ],
  },
] as const;

export const CONTENT_KIND = {
  music: 0,
  video: 1,
  writing: 2,
  podcast: 3,
  film: 4,
} as const;

export type ContentKind = keyof typeof CONTENT_KIND;

/** Helper: are contracts deployed on this chain yet? */
export function isLive(chainId: number): boolean {
  const a = CREAVAULT_ADDRESSES[chainId];
  return !!a && a.registry !== ZERO_ADDRESS;
}
