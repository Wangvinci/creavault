"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useChainId, useSignMessage } from "wagmi";

/**
 * Build an EIP-4361 SIWE message manually so we don't have to bundle
 * the `siwe` package (which transitively pulls a broken ethers build
 * into the client). The format is plain text, the verification on the
 * server uses viem's verifyMessage.
 */
function buildSiweMessage(opts: {
  domain: string;
  address: string;
  uri: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
}): string {
  return [
    `${opts.domain} wants you to sign in with your Ethereum account:`,
    opts.address,
    "",
    "Sign in to Creavault to prove you own this wallet.",
    "",
    `URI: ${opts.uri}`,
    "Version: 1",
    `Chain ID: ${opts.chainId}`,
    `Nonce: ${opts.nonce}`,
    `Issued At: ${opts.issuedAt}`,
  ].join("\n");
}

export function useSiwe() {
  const { address } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const [authedAddress, setAuthedAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => setAuthedAddress(j.address))
      .catch(() => setAuthedAddress(null));
  }, []);

  const signIn = useCallback(async () => {
    if (!address) return;
    setBusy(true);
    try {
      const nonce = await fetch("/api/auth/nonce").then((r) => r.text());
      const message = buildSiweMessage({
        domain: window.location.host,
        address,
        uri: window.location.origin,
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
      });

      const signature = await signMessageAsync({ message });
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, signature, address }),
      }).then((r) => r.json());

      if (res.ok) setAuthedAddress(res.address);
    } finally {
      setBusy(false);
    }
  }, [address, chainId, signMessageAsync]);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/me", { method: "DELETE" });
    setAuthedAddress(null);
  }, []);

  const isAuthed =
    !!authedAddress && !!address && authedAddress.toLowerCase() === address.toLowerCase();

  return { isAuthed, signIn, signOut, busy, authedAddress };
}
