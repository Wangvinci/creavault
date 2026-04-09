"use client";

/**
 * Real IPFS-style content addressing in the browser.
 *
 * 1. computeCidV1Raw(file)  — produces a real CIDv1 using:
 *    - codec: raw (0x55) — for files we don't intend to be DAGs
 *    - hash: sha2-256 (0x12)
 *    - base: base32 multibase (prefix "b")
 *    No external dependency; works for any file.
 *
 * 2. uploadToIpfs(file) — pins to Pinata if NEXT_PUBLIC_PINATA_JWT is
 *    configured; otherwise returns the locally computed CID with
 *    `pinned: false`. Either way the CID is real and resolvable
 *    via any IPFS gateway once the file is pinned somewhere.
 */

const RAW_CODEC = 0x55;
const SHA2_256 = 0x12;

/** Encode an unsigned varint (LEB128) — used for CID prefixes. */
function varint(n: number): number[] {
  const out: number[] = [];
  while (n >= 0x80) {
    out.push((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  out.push(n);
  return out;
}

/** RFC 4648 base32 lowercase, no padding. Multibase prefix "b". */
function base32Encode(bytes: Uint8Array): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz234567";
  let bits = 0;
  let value = 0;
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      out += alphabet[(value >>> bits) & 31];
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}

/**
 * Compute a real CIDv1 (raw codec, sha2-256) for a File or Blob.
 * Returns something like: bafkreibme22gw2h7y2h7tg2fhqotaqmuasi2vy7d4f...
 */
export async function computeCidV1Raw(file: Blob): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", buf));

  // multihash = <code><length><digest>
  const mh = new Uint8Array([SHA2_256, digest.length, ...digest]);
  // CIDv1 = <version=1><codec><multihash>
  const cidBytes = new Uint8Array([
    1,
    ...varint(RAW_CODEC),
    ...mh,
  ]);

  return "b" + base32Encode(cidBytes);
}

export type UploadResult = {
  cid: string;
  pinned: boolean;
  gatewayUrl: string;
};

/**
 * Upload a file to IPFS via Pinata, with progress callback.
 * Falls back to local CID computation if no JWT is configured.
 */
export async function uploadToIpfs(
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const jwt = process.env.NEXT_PUBLIC_PINATA_JWT;

  // Always compute the real CID locally first — even when pinning is on,
  // this lets us show the address immediately.
  const localCid = await computeCidV1Raw(file);
  const gatewayBase =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://w3s.link/ipfs";

  if (!jwt) {
    // No remote pinning available — simulate progress so the UI is consistent.
    for (let p = 10; p <= 100; p += 10) {
      await new Promise((r) => setTimeout(r, 60));
      onProgress?.(p);
    }
    return {
      cid: localCid,
      pinned: false,
      gatewayUrl: `${gatewayBase}/${localCid}`,
    };
  }

  // Real Pinata pin via XHR (so we get progress events).
  return new Promise<UploadResult>((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append(
      "pinataMetadata",
      JSON.stringify({ name: `creavault/${file.name}` })
    );
    form.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://api.pinata.cloud/pinning/pinFileToIPFS");
    xhr.setRequestHeader("Authorization", `Bearer ${jwt}`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress?.(Math.round((e.loaded / e.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText) as { IpfsHash: string };
          resolve({
            cid: res.IpfsHash || localCid,
            pinned: true,
            gatewayUrl: `${gatewayBase}/${res.IpfsHash || localCid}`,
          });
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error(`Pinata ${xhr.status}: ${xhr.responseText}`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error pinning to IPFS"));
    xhr.send(form);
  });
}
