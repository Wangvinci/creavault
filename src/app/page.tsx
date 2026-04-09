"use client";

import { mockContent, typeMeta, gradientFor } from "@/lib/mock-content";
import { SiteNav } from "@/components/SiteNav";
import { ContentCard } from "@/components/ContentCard";

export default function Home() {
  const featured = mockContent.slice(0, 6);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#08080c] text-white">
      {/* single, restrained accent — slowly drifting aurora */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[800px]">
        <div className="cv-aurora absolute left-1/3 top-[-10%] h-[520px] w-[720px] rounded-full bg-violet-600/20 blur-[180px]" />
        <div
          className="cv-aurora absolute right-[15%] top-[5%] h-[360px] w-[460px] rounded-full bg-fuchsia-500/10 blur-[160px]"
          style={{ animationDelay: "-7s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,transparent_0%,#08080c_72%)]" />
      </div>
      {/* subtle grid */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <SiteNav />

      {/* hero — asymmetric editorial */}
      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-14 px-6 pt-20 pb-28 md:grid-cols-12 md:px-10 md:pt-32">
        <div className="md:col-span-7">
          <div className="cv-fade-up mb-8 inline-flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-white/55">
            <span className="h-px w-10 bg-white/30" />
            On-chain creator vault · v0.1
          </div>
          <h1 className="cv-fade-up-2 text-[44px] font-semibold leading-[0.95] tracking-[-0.035em] md:text-[92px]">
            Upload once.
            <br />
            Get paid <span className="italic font-medium text-white/55">forever.</span>
          </h1>
          <p className="cv-fade-up-3 mt-8 max-w-xl text-[15px] leading-[1.65] text-white/55 md:text-[16px]">
            A vault for music, video, podcasts and films — owned by you,
            settled on-chain, and stored on Arweave. No middlemen, no platform
            cut on day one, royalties that follow your work into every wallet
            it ever touches.
          </p>
          <div className="cv-fade-up-4 mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="/upload"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-[13px] font-medium text-black transition hover:bg-white/90 sm:py-3"
            >
              Open the vault
              <span className="transition group-hover:translate-x-0.5">→</span>
            </a>
            <a
              href="/explore"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3.5 text-[13px] font-medium text-white/85 transition hover:border-white/30 hover:text-white sm:py-3"
            >
              Browse 1,284 works
            </a>
          </div>
        </div>

        {/* right rail — featured work preview */}
        <div className="cv-fade-up-5 md:col-span-5">
          <div className="relative">
            <div className="absolute -inset-6 -z-10 rounded-[36px] bg-gradient-to-br from-violet-500/15 via-transparent to-cyan-500/10 blur-3xl" />
            <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-3 backdrop-blur-xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
              <div
                className={`relative aspect-[4/5] overflow-hidden rounded-[14px] bg-gradient-to-br ${gradientFor(
                  featured[0].id
                )}`}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-white/70">
                    {typeMeta[featured[0].type].label} · Featured
                  </div>
                  <div className="mt-1 text-2xl font-semibold tracking-tight">
                    {featured[0].title}
                  </div>
                  <div className="mt-1 text-xs text-white/70">
                    by {featured[0].creator}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-2 pt-3 pb-1 text-[11px]">
                <div className="text-white/50">
                  {featured[0].collectors.toLocaleString()} collectors
                </div>
                <div className="font-mono text-white/80">
                  Ξ {featured[0].priceEth}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* live activity marquee */}
      <section className="border-y border-white/5 overflow-hidden">
        <div className="cv-marquee flex whitespace-nowrap py-3 text-[11px] uppercase tracking-[0.18em] text-white/55">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex items-center gap-10 pr-10">
              <span className="flex items-center gap-2">
                <span className="h-1 w-1 rounded-full bg-emerald-400" /> Lyra Vance minted Midnight Orbit · 4m ago
              </span>
              <span className="text-white/15">/</span>
              <span>0x88a5… collected Deep Channel · 11m ago</span>
              <span className="text-white/15">/</span>
              <span>Theo Marsh shipped After the Static · 23m ago</span>
              <span className="text-white/15">/</span>
              <span>0x3e1b… signed in to vault · 31m ago</span>
              <span className="text-white/15">/</span>
              <span>Iris Halden minted Ferns &amp; Frequencies · 1h ago</span>
              <span className="text-white/15">/</span>
            </div>
          ))}
        </div>
      </section>

      {/* metrics strip — simple, monoline */}
      <section className="border-b border-white/5">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-white/5 px-6 md:grid-cols-4 md:divide-x md:px-10">
          {[
            { v: "95%", l: "Creator take-home" },
            { v: "1,284", l: "Works minted" },
            { v: "8.4 ETH", l: "Paid out this month" },
            { v: "4", l: "Chains supported" },
          ].map((s) => (
            <div key={s.l} className="px-2 py-8">
              <div className="font-mono text-2xl tracking-tight text-white md:text-3xl">
                {s.v}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.15em] text-white/55">
                {s.l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* how it works — AE timeline metaphor */}
      <section className="relative border-b border-white/5 bg-[#0a0a0e]">
        <div className="mx-auto max-w-7xl px-6 py-24 md:px-10">
          <div className="mb-16 max-w-2xl">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
              How it works
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Upload. Mint. Get paid.
              <br />
              <span className="text-white/55">Four steps, one transaction.</span>
            </h2>
          </div>

          {/* AE-style timeline */}
          <div className="relative">
            {/* timeline line */}
            <div className="absolute left-6 top-0 bottom-0 hidden w-px bg-gradient-to-b from-violet-500/40 via-fuchsia-500/30 to-transparent md:block" />

            <div className="space-y-0">
              {[
                {
                  n: "01",
                  t: "Upload to IPFS + Arweave",
                  d: "Your file is content-addressed with a real CIDv1, pinned to IPFS, then permanently archived on Arweave. The hash is your proof of authorship — timestamped, immutable.",
                  tag: "STORAGE",
                  mono: "sha2-256 → CIDv1",
                },
                {
                  n: "02",
                  t: "Register on ContentRegistry",
                  d: "One transaction writes your CID, price, royalty rate, and revenue splits to the smart contract. Gas cost on Base: ~$0.04.",
                  tag: "ON-CHAIN",
                  mono: "register(kind, cid, price, royalty, splits[])",
                },
                {
                  n: "03",
                  t: "Collector pays, you receive",
                  d: "Buyer calls collect() → contract splits payment to you + collaborators in the same tx. Protocol fee: 2.5%. No escrow, no delay.",
                  tag: "SETTLEMENT",
                  mono: "collect{value: 0.012 ETH}(workId)",
                },
                {
                  n: "04",
                  t: "Royalties on every resale",
                  d: "EIP-2981 tells every marketplace your royalty rate. OpenSea, Zora, Rainbow — they all honor it. You earn 10% on every secondary sale, forever.",
                  tag: "ROYALTY",
                  mono: "royaltyInfo(workId, salePrice) → (creator, 10%)",
                },
              ].map((step, i) => (
                <div
                  key={step.n}
                  className="group relative grid grid-cols-1 gap-6 border-b border-white/[0.04] py-8 last:border-0 md:grid-cols-12 md:py-10"
                >
                  {/* timeline dot */}
                  <div className="absolute left-[21px] top-12 hidden h-3 w-3 rounded-full border-2 border-violet-400/60 bg-[#0a0a0e] md:block" />

                  <div className="flex items-baseline gap-4 md:col-span-1 md:pl-14">
                    <span className="font-mono text-[11px] text-violet-400/70">
                      {step.n}
                    </span>
                  </div>

                  <div className="md:col-span-4 md:pl-4">
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white/55">
                      {step.tag}
                    </div>
                    <h3 className="mt-3 text-lg font-medium tracking-tight md:text-xl">
                      {step.t}
                    </h3>
                  </div>

                  <div className="md:col-span-4">
                    <p className="text-[13px] leading-relaxed text-white/50">
                      {step.d}
                    </p>
                  </div>

                  <div className="md:col-span-3">
                    {/* AE-style code preview */}
                    <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 cv-comp-border">
                      <div className="cv-scrubber" style={{ animationDelay: `${i * 2}s` }} />
                      <div className="font-mono text-[10px] leading-relaxed text-white/55 cv-prop-value">
                        {step.mono}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* featured grid — real cards */}
      <section id="explore" className="mx-auto max-w-7xl px-6 py-24 md:px-10">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
              Now in the vault
            </div>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
              Recent drops
            </h2>
          </div>
          <a
            href="/explore"
            className="hidden text-[13px] text-white/55 transition hover:text-white md:block"
          >
            See all →
          </a>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((c) => (
            <ContentCard key={c.id} c={c} />
          ))}
        </div>
      </section>

      {/* manifesto block */}
      <section className="border-t border-white/5">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-24 md:grid-cols-12 md:px-10">
          <div className="md:col-span-4">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
              Why creavault
            </div>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
              The platform doesn&rsquo;t own your audience.
              <br />
              <span className="text-white/55">You do.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-px self-end overflow-hidden rounded-2xl border border-white/10 bg-white/5 sm:grid-cols-2 md:col-span-8">
            {[
              {
                t: "Storage that outlives the platform",
                d: "Every upload is permanent on Arweave. If creavault disappears tomorrow, your work doesn't.",
              },
              {
                t: "Royalties that follow the work",
                d: "EIP-2981 royalties pay you on every secondary sale, in every wallet, forever.",
              },
              {
                t: "Pay in what you hold",
                d: "USDC, ETH, SOL, or $CREA — buyers choose, creators settle in their preferred token.",
              },
              {
                t: "Owned by the people who use it",
                d: "Listing fees, curation, and treasury are all governed by token holders. No board.",
              },
            ].map((b) => (
              <div key={b.t} className="bg-[#08080c] p-6">
                <div className="text-[15px] font-medium tracking-tight">
                  {b.t}
                </div>
                <div className="mt-2 text-[13px] leading-relaxed text-white/50">
                  {b.d}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-10 text-[11px] text-white/35 md:flex-row md:px-10">
          <div>© 2026 creavault · Built on Base · Optimism · Solana</div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white/70">Twitter</a>
            <a href="#" className="hover:text-white/70">Farcaster</a>
            <a href="#" className="hover:text-white/70">Github</a>
            <a href="#" className="hover:text-white/70">Discord</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
