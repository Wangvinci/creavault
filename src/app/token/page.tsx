"use client";

import { SiteNav } from "@/components/SiteNav";
import { useState } from "react";

const INITIAL = 100_000_000;
const FLOOR = 20_000_000;
const BURNED = 3_420_000; // mock — would come from on-chain getBurnedAmount()
const STAKED = 28_140_000;
const TVL_ETH = 312.4;
const APR = 6.8; // %, derived from last 30d revenue / staked

const allocation = [
  { label: "Creator + community rewards", pct: 35, color: "bg-violet-500" },
  { label: "Team", pct: 20, color: "bg-fuchsia-500" },
  { label: "Investors", pct: 15, color: "bg-cyan-400" },
  { label: "Treasury / DAO", pct: 15, color: "bg-emerald-400" },
  { label: "Liquidity", pct: 10, color: "bg-amber-400" },
  { label: "Airdrop (early users)", pct: 5, color: "bg-rose-400" },
];

export default function TokenPage() {
  const [stakeAmount, setStakeAmount] = useState("1000");
  const circulating = INITIAL - BURNED;
  const burnPct = (BURNED / (INITIAL - FLOOR)) * 100;

  const annualEth =
    (parseFloat(stakeAmount || "0") / Math.max(STAKED, 1)) * (TVL_ETH * 12);

  return (
    <main className="min-h-screen bg-[#08080c] text-white">
      <SiteNav />

      {/* hero */}
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="cv-aurora absolute left-1/2 top-[-30%] h-[460px] w-[640px] -translate-x-1/2 rounded-full bg-violet-600/15 blur-[160px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,#08080c_75%)]" />
        </div>
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-20 md:px-10 md:pt-24">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
            $CREA · the protocol token
          </div>
          <div className="mt-3 grid grid-cols-1 items-end gap-12 md:grid-cols-12">
            <div className="md:col-span-7">
              <h1 className="text-[44px] font-semibold leading-[0.98] tracking-[-0.03em] md:text-[80px]">
                Fixed cap.
                <br />
                <span className="italic font-medium text-white/55">
                  Real revenue.
                </span>
              </h1>
              <p className="mt-7 max-w-xl text-[15px] leading-[1.65] text-white/55 md:text-[16px]">
                100M CREA, minted once, never again. Every protocol fee buys
                CREA back from the open market and burns it — until 20M, the
                permanent floor. Stakers earn ETH, not freshly-minted bags.
              </p>
            </div>
            <div className="md:col-span-5">
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <Stat label="Circulating" value={fmt(circulating)} mono />
                <Stat label="Burn floor" value={fmt(FLOOR)} mono />
                <Stat label="Total burned" value={fmt(BURNED)} mono accent />
                <Stat label="Staking APR (30d)" value={`${APR}%`} mono accent />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* burn progress */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
              Burn engine
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Every fee, less supply.
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-white/55">
              Treasury collects 2.5% of every collect on Creavault. That ETH is
              market-bought into CREA on Uniswap, then burned on-chain via{" "}
              <code className="font-mono text-white/70">burnFromTreasury()</code>.
              Hard-capped at 5M CREA per epoch — even a compromised treasury
              cannot drain supply.
            </p>
          </div>
          <div className="md:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div className="flex items-end justify-between text-[12px] text-white/55">
                <span>0</span>
                <span className="font-mono text-white">
                  {fmt(BURNED)} burned
                </span>
                <span>{fmt(INITIAL - FLOOR)} max</span>
              </div>
              <div className="relative mt-2 h-3 overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-rose-500"
                  style={{ width: `${burnPct}%` }}
                />
              </div>
              <div className="mt-2 text-[11px] text-white/55">
                {burnPct.toFixed(2)}% to floor
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <Tile k="100M" v="Initial cap (immutable)" />
                <Tile k="5M / yr" v="Max burn rate" />
                <Tile k="20M" v="Permanent floor" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* allocation */}
      <section className="border-y border-white/5 bg-white/[0.01]">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-20 md:grid-cols-12 md:px-10">
          <div className="md:col-span-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
              Allocation
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Where the 100M go.
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-white/55">
              All vesting handled by audited Sablier streams, not custom code.
              Team and investors are on 4-year and 3-year linear unlocks with
              1-year cliffs. Liquidity is locked for 2 years.
            </p>
          </div>
          <div className="md:col-span-7">
            <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
              {allocation.map((a) => (
                <div
                  key={a.label}
                  className={`${a.color}`}
                  style={{ width: `${a.pct}%` }}
                  title={`${a.label} · ${a.pct}%`}
                />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {allocation.map((a) => (
                <div
                  key={a.label}
                  className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-[13px]"
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 rounded-full ${a.color}`} />
                    <span className="text-white/75">{a.label}</span>
                  </div>
                  <span className="font-mono text-white">{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* staking calculator */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
              Staking — earn ETH
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Real yield, no emissions.
            </h2>
            <p className="mt-5 text-[14px] leading-relaxed text-white/55">
              Stake CREA, receive a pro-rata share of every ETH the protocol
              forwards to the staking contract. No new CREA is minted to pay
              you — there can&rsquo;t be, the supply is fixed. Cooldown to
              withdraw is 7 days.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-[11px] text-white/55">
              <Pill>{fmt(STAKED)} CREA staked</Pill>
              <Pill>{TVL_ETH} ETH paid (30d)</Pill>
              <Pill>7-day cooldown</Pill>
            </div>
          </div>
          <div className="md:col-span-7">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                Calculator
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <input
                  value={stakeAmount}
                  onChange={(e) =>
                    setStakeAmount(e.target.value.replace(/[^0-9.]/g, ""))
                  }
                  className="w-40 border-b border-white/10 bg-transparent py-1 font-mono text-3xl outline-none focus:border-white/40"
                />
                <span className="text-[12px] text-white/55">CREA staked</span>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="bg-[#08080c] p-5">
                  <div className="text-[11px] uppercase tracking-[0.15em] text-white/55">
                    Est. yearly ETH
                  </div>
                  <div className="mt-2 font-mono text-2xl">
                    Ξ {annualEth.toFixed(4)}
                  </div>
                  <div className="mt-1 text-[11px] text-white/55">
                    ≈ ${(annualEth * 2750).toFixed(0)} at $2,750/ETH
                  </div>
                </div>
                <div className="bg-[#08080c] p-5">
                  <div className="text-[11px] uppercase tracking-[0.15em] text-white/55">
                    Pool share
                  </div>
                  <div className="mt-2 font-mono text-2xl">
                    {(
                      (parseFloat(stakeAmount || "0") /
                        (STAKED + parseFloat(stakeAmount || "0"))) *
                      100
                    ).toFixed(3)}
                    %
                  </div>
                  <div className="mt-1 text-[11px] text-white/55">
                    of staking rewards
                  </div>
                </div>
              </div>

              <button
                disabled
                className="mt-6 w-full rounded-full bg-white/10 py-3.5 text-[13px] font-medium text-white/55"
              >
                Staking opens after audit
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* security stance */}
      <section className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-10">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
            Security stance
          </div>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            Boring code is safe code.
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { t: "No mint function", d: "100M minted in the constructor. mint() does not exist in the bytecode." },
              { t: "No owner", d: "No Ownable, no AccessControl. Treasury can only burn its own balance, nothing else." },
              { t: "No upgradeability", d: "Not a proxy. Bytecode is final on deploy." },
              { t: "Burn rate-limited", d: "5M CREA / 365 days hard cap. A compromised treasury cannot drain supply." },
              { t: "Burn floor", d: "Hard-coded 20M floor. Crossing it reverts the transaction, forever." },
              { t: "EIP-2612 permit", d: "Gasless approvals. Standard nonces + deadline. Domain pinned at deploy." },
              { t: "Reentrancy guards", d: "Every staking entrypoint that moves ETH is nonReentrant + pull-payment." },
              { t: "No transfer hooks", d: "No tax, no reflection, no blocklist. ERC-20 transfers behave exactly as expected." },
              { t: "Audit gauntlet", d: "Slither → Foundry invariants → Spearbit → Code4rena → Immunefi $250k bounty." },
            ].map((b) => (
              <div key={b.t} className="bg-[#08080c] p-6">
                <div className="text-[14px] font-medium tracking-tight">
                  {b.t}
                </div>
                <div className="mt-2 text-[12px] leading-relaxed text-white/50">
                  {b.d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto max-w-7xl px-6 py-10 text-[11px] text-white/35 md:px-10">
          $CREA contract: not yet deployed · audit in progress
        </div>
      </footer>
    </main>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function Stat({
  label,
  value,
  mono,
  accent,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div className="text-[10px] uppercase tracking-[0.15em] text-white/55">
        {label}
      </div>
      <div
        className={`mt-1.5 text-2xl ${mono ? "font-mono" : ""} ${
          accent ? "text-violet-300" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Tile({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] py-4 px-3">
      <div className="font-mono text-lg text-white">{k}</div>
      <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/55">
        {v}
      </div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono">
      {children}
    </span>
  );
}
