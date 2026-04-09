"use client";

/**
 * Local-first works store.
 *
 * Until contracts are deployed, "minting" a work writes to localStorage.
 * Same shape as the mock content + a `local: true` flag so the UI can
 * mark these as "draft" / "pending on-chain". Once contracts are live,
 * this whole module is replaced with subgraph reads — the *consumers*
 * (explore page, vault page) won't need to change.
 */

import { useEffect, useState } from "react";
import { Content } from "./mock-content";

const KEY = "creavault:works:v1";
const COLLECT_KEY = "creavault:collected:v1";

export type LocalWork = Content & {
  local: true;
  ownerAddress: string; // wallet that minted it
  fileName?: string;
  fileSize?: number;
};

function read<T>(key: string): T[] {
  try {
    if (
      typeof window === "undefined" ||
      typeof localStorage === "undefined" ||
      typeof localStorage.getItem !== "function"
    ) {
      return [];
    }
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]) {
  try {
    if (
      typeof window === "undefined" ||
      typeof localStorage === "undefined" ||
      typeof localStorage.setItem !== "function"
    ) {
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event("creavault:store"));
  } catch {
    /* swallow — best effort */
  }
}

export function listLocalWorks(): LocalWork[] {
  return read<LocalWork>(KEY);
}

export function addLocalWork(w: LocalWork) {
  const all = listLocalWorks();
  write(KEY, [w, ...all]);
}

export function listCollected(address?: string): string[] {
  if (!address) return [];
  const all = read<{ address: string; workId: string }>(COLLECT_KEY);
  return all.filter((x) => x.address.toLowerCase() === address.toLowerCase()).map((x) => x.workId);
}

export function collect(address: string, workId: string) {
  const all = read<{ address: string; workId: string }>(COLLECT_KEY);
  if (all.some((x) => x.address.toLowerCase() === address.toLowerCase() && x.workId === workId))
    return;
  write(COLLECT_KEY, [{ address, workId }, ...all]);
}

/** React hook that re-renders when the local store changes (this tab + others). */
export function useLocalStore<T>(read: () => T): T {
  const [v, setV] = useState<T>(read);
  useEffect(() => {
    const refresh = () => setV(read());
    window.addEventListener("creavault:store", refresh);
    window.addEventListener("storage", refresh);
    refresh();
    return () => {
      window.removeEventListener("creavault:store", refresh);
      window.removeEventListener("storage", refresh);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return v;
}

/** Deterministic-ish slug from a title. */
export function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60) || `work-${Date.now().toString(36)}`
  );
}

/** Fake-but-plausible CID for the prototype. */
export function fakeCid(seed: string): string {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  const tail = Math.abs(h).toString(36).padStart(8, "0");
  return `bafybeih${tail}${tail}xq`;
}
