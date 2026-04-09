"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { gradientFor, typeMeta } from "@/lib/mock-content";
import { SiteNav } from "@/components/SiteNav";
import { ContentCard } from "@/components/ContentCard";
import { useAllWorks } from "@/lib/all-works";
import { useAccount } from "wagmi";
import { collect, listCollected, useLocalStore } from "@/lib/works-store";

export default function WorkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const all = useAllWorks();
  const c = all.find((x) => x.id === id);
  const { address, isConnected } = useAccount();
  const collected = useLocalStore<string[]>(() => listCollected(address));

  if (!c) {
    if (all.length === 0) {
      // store still hydrating
      return (
        <main className="min-h-screen bg-[#08080c] text-white">
          <SiteNav />
        </main>
      );
    }
    notFound();
  }

  const owned = collected.includes(c.id);
  const more = all.filter((x) => x.id !== c.id).slice(0, 4);
  const creaPrice = (parseFloat(c.priceEth || "0") * 0.9).toFixed(4);
  const creaUsd = Math.round(c.priceUsdc * 0.9);

  return (
    <main className="min-h-screen bg-[#08080c] text-white">
      <SiteNav />

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pt-12 pb-20 md:grid-cols-12 md:px-10 md:pt-16">
        {/* artwork */}
        <div className="md:col-span-7">
          <div
            className={`relative aspect-square overflow-hidden rounded-3xl bg-gradient-to-br ${gradientFor(
              c.id
            )}`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.25),transparent_55%)]" />
            <div className="absolute left-5 top-5 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-[11px] uppercase tracking-wider text-white/90 backdrop-blur">
              <span>{typeMeta[c.type].icon}</span>
              {typeMeta[c.type].label}
            </div>
            {c.duration && (
              <div className="absolute right-5 top-5 rounded-full bg-black/50 px-3 py-1.5 font-mono text-[11px] text-white/90 backdrop-blur">
                {c.duration}
              </div>
            )}
            <button className="absolute bottom-5 left-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-[12px] font-medium text-black transition hover:bg-white">
              ▶ Preview
            </button>
          </div>
        </div>

        {/* meta + buy */}
        <div className="md:col-span-5">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
            {typeMeta[c.type].label} · Minted {c.createdAt}
          </div>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            {c.title}
          </h1>
          <div className="mt-4 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-xs font-semibold">
              {c.creator[0]}
            </div>
            <div>
              <div className="text-[14px]">{c.creator}</div>
              <div className="font-mono text-[11px] text-white/55">
                {c.creatorAddress}
              </div>
            </div>
          </div>

          <p className="mt-7 text-[14px] leading-relaxed text-white/65">
            {c.description}
          </p>

          <div className="mt-9 rounded-2xl border border-white/10 bg-white/[0.025] p-6">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                  Price
                </div>
                <div className="mt-1 font-mono text-3xl">
                  {c.priceEth === "0" ? "Free" : `Ξ ${c.priceEth}`}
                </div>
                <div className="text-[11px] text-white/55">
                  ≈ ${c.priceUsdc} USDC
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                  Collectors
                </div>
                <div className="mt-1 text-xl font-medium">
                  {(c.collectors + (owned ? 1 : 0)).toLocaleString()}
                </div>
              </div>
            </div>
            {owned ? (
              <div className="mt-6 rounded-full bg-emerald-500/15 py-3.5 text-center text-[13px] font-medium text-emerald-300">
                ✓ In your vault
              </div>
            ) : (
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => isConnected && address && collect(address, c.id)}
                  disabled={!isConnected}
                  className="w-full rounded-full bg-white py-3.5 text-[13px] font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/55"
                >
                  {isConnected ? `Collect for Ξ ${c.priceEth}` : "Connect wallet to collect"}
                </button>
                {c.priceEth !== "0" && (
                  <button
                    onClick={() => isConnected && address && collect(address, c.id)}
                    disabled={!isConnected}
                    className="group relative w-full overflow-hidden rounded-full border border-violet-400/30 bg-gradient-to-r from-violet-500/15 via-fuchsia-500/15 to-violet-500/15 py-3.5 text-[13px] font-medium text-white transition hover:border-violet-300/50 hover:from-violet-500/25 hover:to-violet-500/25 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="relative z-10">
                      Pay with $CREA · {creaPrice} ETH equiv
                    </span>
                    <span className="ml-2 rounded-full bg-violet-400/20 px-2 py-0.5 text-[10px] text-violet-200">
                      −10%
                    </span>
                  </button>
                )}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between text-[10px] text-white/35">
              <span>EIP-2981 royalty: 10% to creator on resales</span>
              {c.priceEth !== "0" && (
                <span className="font-mono">≈ ${creaUsd} in CREA</span>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 text-[12px]">
            {[
              { k: "Storage", v: "Arweave" },
              { k: "CID", v: c.cid },
              { k: "Plays", v: c.plays.toLocaleString() },
              { k: "Chain", v: "Base" },
            ].map((r) => (
              <div key={r.k} className="bg-[#08080c] px-4 py-3">
                <div className="text-white/55">{r.k}</div>
                <div className="mt-0.5 truncate font-mono text-white/85">{r.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl border-t border-white/5 px-6 py-16 md:px-10">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
            More from the vault
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {more.map((m) => (
            <ContentCard key={m.id} c={m} />
          ))}
        </div>
      </section>
    </main>
  );
}
