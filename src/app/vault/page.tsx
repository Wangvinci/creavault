"use client";

import { useState } from "react";
import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SiteNav } from "@/components/SiteNav";
import { ContentCard } from "@/components/ContentCard";
import { listCollected, listLocalWorks, useLocalStore } from "@/lib/works-store";
import { mockContent } from "@/lib/mock-content";
import { useSiwe } from "@/lib/use-siwe";

type Tab = "minted" | "collected";

export default function VaultPage() {
  const { address, isConnected } = useAccount();
  const { isAuthed, signIn, signOut, busy } = useSiwe();
  const [tab, setTab] = useState<Tab>("minted");

  const minted = useLocalStore(() =>
    listLocalWorks().filter(
      (w) => address && w.ownerAddress.toLowerCase() === address.toLowerCase()
    )
  );

  const collectedIds = useLocalStore(() => listCollected(address));
  const collected = useLocalStore(() => {
    const ids = listCollected(address);
    const all = [...listLocalWorks(), ...mockContent];
    return ids.map((id) => all.find((w) => w.id === id)).filter(Boolean) as typeof mockContent;
  });

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#08080c] text-white">
        <SiteNav />
        <section className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-6 text-center">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
              Your vault
            </div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Connect a wallet
              <br />
              <span className="text-white/55">to see what&rsquo;s inside.</span>
            </h1>
            <p className="mt-4 text-[14px] text-white/55">
              Your minted works and collected pieces live here, tied to your
              address — not to a Creavault account.
            </p>
            <div className="mt-8 flex justify-center">
              <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
            </div>
          </div>
        </section>
      </main>
    );
  }

  const list = tab === "minted" ? minted : collected;

  return (
    <main className="min-h-screen bg-[#08080c] text-white">
      <SiteNav />

      <section className="mx-auto max-w-7xl px-6 pt-12 pb-8 md:px-10 md:pt-16">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
          Your vault
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          {minted.length + collected.length}{" "}
          <span className="text-white/55">
            {minted.length + collected.length === 1 ? "work" : "works"}
          </span>
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 font-mono text-[11px] text-white/55">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {address?.slice(0, 6)}…{address?.slice(-4)}
          </div>
          {isAuthed ? (
            <div className="flex items-center gap-2 text-[11px]">
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-0.5 text-emerald-300">
                ✓ Signed in
              </span>
              <button
                onClick={signOut}
                className="text-white/55 transition hover:text-white/70"
              >
                sign out
              </button>
            </div>
          ) : (
            <button
              onClick={signIn}
              disabled={busy}
              className="rounded-full border border-white/15 px-3 py-1 text-[11px] text-white/70 transition hover:border-white/30 hover:text-white disabled:opacity-50"
            >
              {busy ? "Signing…" : "Sign in with wallet"}
            </button>
          )}
        </div>
      </section>

      <section className="border-y border-white/5">
        <div className="mx-auto flex max-w-7xl items-center gap-1.5 px-6 py-4 md:px-10">
          <Tab1
            label={`Minted · ${minted.length}`}
            active={tab === "minted"}
            onClick={() => setTab("minted")}
          />
          <Tab1
            label={`Collected · ${collectedIds.length}`}
            active={tab === "collected"}
            onClick={() => setTab("collected")}
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
        {list.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {list.map((c) => (
              <ContentCard key={c.id} c={c} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Tab1({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-[12px] transition ${
        active
          ? "bg-white text-black"
          : "border border-white/10 text-white/65 hover:border-white/25 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="grid min-h-[40vh] place-items-center rounded-2xl border border-dashed border-white/10 px-6 py-20 text-center">
      <div className="max-w-sm">
        <div className="text-3xl text-white/25">∅</div>
        <div className="mt-3 text-[15px] font-medium">
          {tab === "minted" ? "Nothing minted yet" : "Nothing collected yet"}
        </div>
        <div className="mt-2 text-[13px] text-white/55">
          {tab === "minted"
            ? "Upload your first work and it will live here forever, tied to your wallet."
            : "Browse the vault and collect a work to see it here."}
        </div>
        <Link
          href={tab === "minted" ? "/upload" : "/explore"}
          className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-[13px] font-medium text-black transition hover:bg-white/90"
        >
          {tab === "minted" ? "Mint a work →" : "Explore the vault →"}
        </Link>
      </div>
    </div>
  );
}
