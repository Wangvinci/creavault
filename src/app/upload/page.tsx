"use client";

import { useState } from "react";
import { ContentType, typeMeta } from "@/lib/mock-content";
import { SiteNav } from "@/components/SiteNav";
import { useAccount } from "wagmi";
import { addLocalWork, slugify } from "@/lib/works-store";
import { uploadToIpfs } from "@/lib/ipfs";
import { useMintWork } from "@/lib/use-mint-work";
import { useRouter } from "next/navigation";

const types: ContentType[] = ["music", "video", "writing", "podcast", "film"];

type Step = "draft" | "uploading" | "minting" | "minted";

export default function UploadPage() {
  const { address, isConnected } = useAccount();
  const { mint, isLive } = useMintWork();
  const router = useRouter();
  const [type, setType] = useState<ContentType>("music");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("0.01");
  const [royalty, setRoyalty] = useState(10);
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("draft");
  const [progress, setProgress] = useState(0);
  const [mintedId, setMintedId] = useState<string | null>(null);
  const [pinResult, setPinResult] = useState<{ cid: string; pinned: boolean } | null>(null);

  const canMint = isConnected && title.trim().length > 0 && file !== null;

  async function handleMint() {
    if (!canMint || !address || !file) return;
    setStep("uploading");
    setProgress(0);

    // Real CIDv1 + (optional) Pinata pin
    const pin = await uploadToIpfs(file, setProgress);
    setPinResult({ cid: pin.cid, pinned: pin.pinned });

    setStep("minting");
    // Calls real contract if deployed on the connected chain,
    // otherwise the hook simulates the signing flow.
    await mint({
      kind: type,
      cid: pin.cid,
      metaURI: `ipfs://${pin.cid}/meta.json`,
      priceEth: price.trim() || "0",
      royaltyBps: Math.round(royalty * 100),
    });

    const id = `${slugify(title)}-${Date.now().toString(36)}`;
    const cid = pin.cid;
    const priceEth = price.trim() || "0";
    const priceUsdc = Math.round(parseFloat(priceEth || "0") * 2750);

    addLocalWork({
      id,
      title: title.trim(),
      creator: address.slice(0, 6) + "…" + address.slice(-4),
      creatorAddress: address.slice(0, 6) + "…" + address.slice(-4),
      ownerAddress: address,
      type,
      cover: id,
      priceEth,
      priceUsdc,
      description: desc.trim() || "Untitled work, freshly minted.",
      collectors: 0,
      plays: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      cid,
      fileName: file.name,
      fileSize: file.size,
      local: true,
    });

    setMintedId(id);
    setStep("minted");
  }

  function reset() {
    setStep("draft");
    setMintedId(null);
    setTitle("");
    setDesc("");
    setFile(null);
    setProgress(0);
  }

  return (
    <main className="min-h-screen bg-[#08080c] text-white">
      <SiteNav />

      <section className="mx-auto max-w-5xl px-6 pt-12 pb-20 md:px-10 md:pt-20">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
          New drop
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          Mint a work
        </h1>
        <p className="mt-3 max-w-xl text-[14px] text-white/55">
          Your file is uploaded to IPFS, then permanently archived on Arweave.
          The on-chain record points to both — your work outlives any single host.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-12">
          {/* left form */}
          <div className="md:col-span-7 space-y-10">
            <Field label="Type">
              <div className="flex flex-wrap gap-1.5">
                {types.map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    disabled={step !== "draft"}
                    className={`rounded-full px-3.5 py-1.5 text-[12px] transition ${
                      type === t
                        ? "bg-white text-black"
                        : "border border-white/10 text-white/65 hover:border-white/25 hover:text-white"
                    } disabled:opacity-40`}
                  >
                    <span className="mr-1.5">{typeMeta[t].icon}</span>
                    {typeMeta[t].label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={step !== "draft"}
                placeholder="Midnight Orbit"
                className="w-full border-b border-white/10 bg-transparent py-2 text-2xl font-medium tracking-tight outline-none placeholder:text-white/20 focus:border-white/40 disabled:opacity-50"
              />
            </Field>

            <Field label="Description">
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
                disabled={step !== "draft"}
                placeholder="What is this work? What inspired it? Who is it for?"
                className="w-full resize-none border-b border-white/10 bg-transparent py-2 text-[14px] outline-none placeholder:text-white/20 focus:border-white/40 disabled:opacity-50"
              />
            </Field>

            <Field label="File">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-6 transition hover:border-white/30 hover:bg-white/[0.04] ${
                  step !== "draft" ? "pointer-events-none opacity-60" : ""
                }`}
              >
                <div>
                  <div className="text-[14px] text-white">
                    {file ? file.name : "Drop a file or click to choose"}
                  </div>
                  <div className="mt-1 text-[11px] text-white/55">
                    {file
                      ? `${(file.size / 1024 / 1024).toFixed(1)} MB · will pin to IPFS + Arweave`
                      : "Up to 4 GB · audio, video, image, pdf, epub"}
                  </div>
                </div>
                <span className="font-mono text-xs text-white/60">↑ choose</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </Field>

            <div className="grid grid-cols-2 gap-6">
              <Field label="Price (ETH)">
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  disabled={step !== "draft"}
                  className="w-full border-b border-white/10 bg-transparent py-2 font-mono text-lg outline-none placeholder:text-white/20 focus:border-white/40 disabled:opacity-50"
                />
              </Field>
              <Field label={`Royalty · ${royalty}%`}>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={0.5}
                  value={royalty}
                  onChange={(e) => setRoyalty(parseFloat(e.target.value))}
                  disabled={step !== "draft"}
                  className="mt-3 w-full accent-violet-400"
                />
              </Field>
            </div>
          </div>

          {/* right preview */}
          <div className="md:col-span-5">
            <div className="sticky top-8">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
                {step === "minted" ? "Minted ✓" : "Live preview"}
              </div>
              <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3 cv-comp-border">
                <div className="relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 cv-comp-corner">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.25),transparent_55%)]" />
                  {/* AE-style overlay data */}
                  <div className="absolute right-3 bottom-3 flex flex-col items-end gap-1 font-mono text-[9px] text-white/50">
                    <span>CID: {file ? "computing…" : "—"}</span>
                    <span>{file ? `${(file.size / 1024 / 1024).toFixed(1)}MB` : "no file"}</span>
                  </div>
                  <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/85 backdrop-blur">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 cv-pulse" />
                    <span>{typeMeta[type].icon}</span>
                    {typeMeta[type].label}
                  </div>
                  {step === "uploading" && (
                    <div className="absolute inset-x-3 bottom-3 rounded-full bg-black/60 px-3 py-2 text-[10px] backdrop-blur">
                      <div className="flex items-center justify-between text-white/80">
                        <span>Pinning to IPFS</span>
                        <span className="font-mono">{progress}%</span>
                      </div>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full bg-white transition-all duration-100"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {step === "minting" && (
                    <div className="absolute inset-x-3 bottom-3 rounded-full bg-black/60 px-3 py-2 text-center text-[11px] text-white/80 backdrop-blur">
                      Confirming on-chain…
                    </div>
                  )}
                  {step === "minted" && (
                    <div className="absolute inset-0 grid place-items-center bg-black/40 backdrop-blur-sm">
                      <div className="text-center">
                        <div className="text-3xl">✓</div>
                        <div className="mt-1 text-[12px] text-white/85">
                          Live in the vault
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="px-1 pt-3.5 pb-1.5">
                  <div className="truncate text-[15px] font-medium tracking-tight">
                    {title || "Untitled work"}
                  </div>
                  <div className="mt-0.5 text-xs text-white/55">
                    by you · {royalty}% royalty
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-[12px]">
                <Row k="Storage" v={pinResult?.pinned ? "Pinned to IPFS" : "IPFS + Arweave"} />
                <Row k="Chain" v="Base" />
                <Row k="Price" v={`Ξ ${price || "0"}`} />
                <Row k="Royalty" v={`${royalty}% forever`} />
                <Row k="Platform fee" v="0% (early creator)" />
                {pinResult && (
                  <>
                    <div className="my-2 h-px bg-white/10" />
                    <div>
                      <div className="text-white/55">CID</div>
                      <div className="mt-1 truncate font-mono text-[10px] text-white/85">
                        {pinResult.cid}
                      </div>
                    </div>
                  </>
                )}
                <div className="my-2 h-px bg-white/10" />
                <Row k="Estimated gas" v="~$0.04" mono />
                {!isLive && (
                  <div className="mt-1 rounded-lg border border-amber-300/15 bg-amber-300/5 px-3 py-2 text-[10px] text-amber-200/80">
                    Contracts not deployed on this chain yet — you&rsquo;ll
                    sign a simulated mint.
                  </div>
                )}
              </div>

              {step === "minted" && mintedId ? (
                <div className="mt-6 space-y-2">
                  <button
                    onClick={() => router.push(`/work/${mintedId}`)}
                    className="w-full rounded-full bg-white py-3.5 text-[13px] font-medium text-black transition hover:bg-white/90"
                  >
                    View in vault →
                  </button>
                  <button
                    onClick={reset}
                    className="w-full rounded-full border border-white/15 py-3.5 text-[13px] font-medium text-white/85 transition hover:border-white/30 hover:text-white"
                  >
                    Mint another
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleMint}
                  disabled={!canMint || step !== "draft"}
                  className="mt-6 w-full rounded-full bg-white py-3.5 text-[13px] font-medium text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/55"
                >
                  {!isConnected
                    ? "Connect wallet to mint"
                    : step === "uploading"
                    ? "Uploading…"
                    : step === "minting"
                    ? "Confirming…"
                    : "Mint to vault"}
                </button>
              )}

              <div className="mt-3 text-center text-[10px] text-white/35">
                You keep 100% of the first sale and {royalty}% of every resale.
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/55">
        {label}
      </div>
      {children}
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/55">{k}</span>
      <span className={mono ? "font-mono text-white/85" : "text-white/85"}>{v}</span>
    </div>
  );
}
