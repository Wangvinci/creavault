import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#0a0a0e] px-6 text-white">
      <div className="text-center">
        <div className="font-mono text-[120px] font-bold leading-none tracking-tighter text-white/[0.04] md:text-[200px]">
          404
        </div>
        <h1 className="-mt-10 text-3xl font-semibold tracking-tight md:-mt-16 md:text-5xl">
          Nothing here.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-white/50">
          The work you&rsquo;re looking for may have been moved, removed, or
          never existed. The vault keeps what matters — this wasn&rsquo;t it.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="rounded-full bg-white px-6 py-3 text-[13px] font-medium text-black transition hover:bg-white/90"
          >
            Back to home
          </Link>
          <Link
            href="/explore"
            className="rounded-full border border-white/15 px-6 py-3 text-[13px] font-medium text-white/80 transition hover:border-white/30 hover:text-white"
          >
            Explore the vault
          </Link>
        </div>
      </div>
    </main>
  );
}
