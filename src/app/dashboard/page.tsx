"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { SiteNav } from "@/components/SiteNav";
import { listLocalWorks, listCollected, useLocalStore } from "@/lib/works-store";
import { mockContent, typeMeta, gradientFor } from "@/lib/mock-content";

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  const minted = useLocalStore(() =>
    listLocalWorks().filter(
      (w) => address && w.ownerAddress.toLowerCase() === address.toLowerCase()
    )
  );
  const collectedIds = useLocalStore(() => listCollected(address));

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-[#0a0a0e] text-white">
        <SiteNav />
        <section className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-6 text-center">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">Dashboard</div>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Connect wallet<br /><span className="text-white/55">to open your dashboard.</span>
            </h1>
            <div className="mt-8 flex justify-center">
              <ConnectButton />
            </div>
          </div>
        </section>
      </main>
    );
  }

  // Mock analytics
  const totalEarned = minted.reduce((s, w) => s + parseFloat(w.priceEth || "0") * w.collectors, 0);
  const totalPlays = minted.reduce((s, w) => s + w.plays, 0);
  const recentActivity = [
    { action: "Collected", who: "0x88a5…1c33", work: "Midnight Orbit", time: "4m ago", eth: "0.012" },
    { action: "Minted", who: "you", work: minted[0]?.title || "—", time: "12m ago", eth: "—" },
    { action: "Collected", who: "0x3e1b…77fa", work: "Pelagic", time: "28m ago", eth: "0.018" },
    { action: "Royalty", who: "secondary sale", work: "Midnight Orbit", time: "1h ago", eth: "0.0012" },
    { action: "Collected", who: "0x5d4e…0bc7", work: "Deep Channel", time: "3h ago", eth: "0" },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0e] text-white cv-noise relative">
      <SiteNav />

      <section className="mx-auto max-w-7xl px-6 pt-10 pb-6 md:px-10 md:pt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 cv-pulse" />
              Dashboard
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Welcome back
            </h1>
            <div className="mt-1 font-mono text-[11px] text-white/35">
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/upload"
              className="rounded-full bg-white px-5 py-2.5 text-[12px] font-medium text-black transition hover:bg-white/90"
            >
              Mint a work →
            </Link>
            <Link
              href="/vault"
              className="rounded-full border border-white/15 px-5 py-2.5 text-[12px] font-medium text-white/80 transition hover:border-white/30"
            >
              My vault
            </Link>
          </div>
        </div>
      </section>

      {/* stats row — AE properties panel style */}
      <section className="mx-auto max-w-7xl px-6 pb-8 md:px-10">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <PropCard label="Works minted" value={String(minted.length)} />
          <PropCard label="Total earned" value={`Ξ ${totalEarned.toFixed(4)}`} accent />
          <PropCard label="Collected" value={String(collectedIds.length)} />
          <PropCard label="Total plays" value={totalPlays.toLocaleString()} />
        </div>
      </section>

      {/* main grid */}
      <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* left: your works */}
          <div className="md:col-span-7">
            <Panel title="Your works" action={{ label: "See all →", href: "/vault" }}>
              {minted.length === 0 ? (
                <div className="py-12 text-center text-[13px] text-white/35">
                  No works yet.{" "}
                  <Link href="/upload" className="text-violet-300 hover:text-violet-200">
                    Mint your first →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {minted.slice(0, 5).map((w) => (
                    <Link
                      key={w.id}
                      href={`/work/${w.id}`}
                      className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/[0.03]"
                    >
                      <div className={`h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br ${gradientFor(w.id)}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{w.title}</div>
                        <div className="text-[10px] text-white/55">
                          {typeMeta[w.type].label} · {w.collectors} collectors
                        </div>
                      </div>
                      <div className="shrink-0 font-mono text-[12px] text-white/70">
                        {w.priceEth === "0" ? "Free" : `Ξ ${w.priceEth}`}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Panel>

            {/* trending from vault */}
            <div className="mt-6">
              <Panel title="Trending in the vault">
                <div className="divide-y divide-white/[0.04]">
                  {mockContent.slice(0, 4).map((w, i) => (
                    <Link
                      key={w.id}
                      href={`/work/${w.id}`}
                      className="flex items-center gap-4 px-4 py-3 transition hover:bg-white/[0.03]"
                    >
                      <span className="w-5 text-center font-mono text-[11px] text-white/30">{i + 1}</span>
                      <div className={`h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br ${gradientFor(w.id)}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{w.title}</div>
                        <div className="text-[10px] text-white/55">{w.creator}</div>
                      </div>
                      <div className="shrink-0 font-mono text-[11px] text-white/50">
                        {w.collectors.toLocaleString()} collectors
                      </div>
                    </Link>
                  ))}
                </div>
              </Panel>
            </div>
          </div>

          {/* right: activity + token */}
          <div className="md:col-span-5 space-y-6">
            <Panel title="Recent activity">
              <div className="divide-y divide-white/[0.04]">
                {recentActivity.map((a, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <div
                      className={`h-6 w-6 shrink-0 rounded-full grid place-items-center text-[8px] font-bold ${
                        a.action === "Collected"
                          ? "bg-emerald-400/15 text-emerald-300"
                          : a.action === "Royalty"
                          ? "bg-violet-400/15 text-violet-300"
                          : "bg-white/10 text-white/60"
                      }`}
                    >
                      {a.action[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px]">
                        <span className="text-white/55">{a.who}</span>{" "}
                        <span className="text-white/35">{a.action.toLowerCase()}</span>{" "}
                        <span className="font-medium">{a.work}</span>
                      </div>
                      <div className="text-[10px] text-white/30">{a.time}</div>
                    </div>
                    {a.eth !== "—" && a.eth !== "0" && (
                      <span className="shrink-0 font-mono text-[10px] text-emerald-300/80">
                        +Ξ{a.eth}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            {/* $CREA mini card */}
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                  $CREA
                </div>
                <Link href="/token" className="text-[11px] text-violet-300 hover:text-violet-200">
                  Details →
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <div className="font-mono text-xl text-white">96.58M</div>
                  <div className="text-[10px] text-white/35">Circulating</div>
                </div>
                <div>
                  <div className="font-mono text-xl text-violet-300">3.42M</div>
                  <div className="text-[10px] text-white/35">Burned</div>
                </div>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full w-[4.28%] rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
              </div>
              <div className="mt-1 text-[9px] text-white/30">4.28% to burn floor (20M)</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function PropCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 cv-comp-border">
      <div className="text-[10px] uppercase tracking-[0.15em] text-white/55">{label}</div>
      <div className={`mt-2 font-mono text-2xl cv-prop-value ${accent ? "text-violet-300" : "text-white"}`}>
        {value}
      </div>
    </div>
  );
}

function Panel({
  title,
  action,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.015]">
      <div className="flex items-center justify-between border-b border-white/[0.04] px-5 py-3.5">
        <span className="text-[12px] font-medium text-white/75">{title}</span>
        {action && (
          <Link href={action.href} className="text-[11px] text-white/55 transition hover:text-white/70">
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
