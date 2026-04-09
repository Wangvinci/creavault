import Link from "next/link";
import { Content, gradientFor, typeMeta } from "@/lib/mock-content";

export function ContentCard({ c }: { c: Content }) {
  return (
    <Link
      href={`/work/${c.id}`}
      className="group block rounded-2xl border border-white/[0.07] bg-white/[0.015] p-3 transition duration-300 ease-out hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.04] hover:shadow-[0_20px_60px_-30px_rgba(167,139,250,0.5)]"
    >
      <div
        className={`relative aspect-square overflow-hidden rounded-xl bg-gradient-to-br ${gradientFor(
          c.id
        )} transition duration-500 group-hover:scale-[1.02]`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.22),transparent_55%)]" />
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/85 backdrop-blur">
          <span>{typeMeta[c.type].icon}</span>
          {typeMeta[c.type].label}
        </div>
        {c.duration && (
          <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 font-mono text-[10px] text-white/85 backdrop-blur">
            {c.duration}
          </div>
        )}
      </div>
      <div className="flex items-start justify-between px-1 pt-3.5 pb-1.5">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-medium tracking-tight">
            {c.title}
          </div>
          <div className="mt-0.5 truncate text-xs text-white/55">{c.creator}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-mono text-[13px] text-white">
            {c.priceEth === "0" ? "Free" : `Ξ ${c.priceEth}`}
          </div>
          <div className="mt-0.5 text-[10px] text-white/40">
            {c.collectors.toLocaleString()}
          </div>
        </div>
      </div>
    </Link>
  );
}
