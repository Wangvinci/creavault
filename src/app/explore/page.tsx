"use client";

import { useState } from "react";
import { ContentType, typeMeta } from "@/lib/mock-content";
import { ContentCard } from "@/components/ContentCard";
import { SiteNav } from "@/components/SiteNav";
import { useAllWorks } from "@/lib/all-works";

const filters: { key: ContentType | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "music", label: "Music" },
  { key: "video", label: "Video" },
  { key: "film", label: "Film" },
  { key: "podcast", label: "Podcast" },
  { key: "writing", label: "Writing" },
];

export default function ExplorePage() {
  const [filter, setFilter] = useState<ContentType | "all">("all");
  const [sort, setSort] = useState<"recent" | "popular">("recent");
  const [query, setQuery] = useState("");
  const all = useAllWorks();

  const q = query.toLowerCase().trim();
  const list = all
    .filter((c) => filter === "all" || c.type === filter)
    .filter(
      (c) =>
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.creator.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    )
    .sort((a, b) =>
      sort === "popular"
        ? b.collectors - a.collectors
        : b.createdAt.localeCompare(a.createdAt)
    );

  return (
    <main className="min-h-screen bg-[#08080c] text-white">
      <SiteNav />
      <section className="mx-auto max-w-7xl px-6 pt-12 pb-8 md:px-10 md:pt-16">
        <div className="text-[11px] uppercase tracking-[0.18em] text-white/55">
          The vault
        </div>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight md:text-5xl">
          Explore <span className="text-white/55">{list.length} works</span>
        </h1>
        {/* search */}
        <div className="relative mt-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, creator, or keyword…"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pl-10 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-white/25 focus:bg-white/[0.05]"
          />
          <svg
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/55 hover:text-white/70"
            >
              clear
            </button>
          )}
        </div>
      </section>

      <section className="sticky top-0 z-10 border-y border-white/5 bg-[#08080c]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-10">
          <div className="flex flex-wrap items-center gap-1.5">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3.5 py-1.5 text-[12px] transition ${
                  filter === f.key
                    ? "bg-white text-black"
                    : "border border-white/10 text-white/65 hover:border-white/25 hover:text-white"
                }`}
              >
                {f.key !== "all" && (
                  <span className="mr-1.5">{typeMeta[f.key].icon}</span>
                )}
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 p-1 text-[12px]">
            <button
              onClick={() => setSort("recent")}
              className={`rounded-full px-3 py-1 transition ${
                sort === "recent" ? "bg-white/10 text-white" : "text-white/55"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setSort("popular")}
              className={`rounded-full px-3 py-1 transition ${
                sort === "popular" ? "bg-white/10 text-white" : "text-white/55"
              }`}
            >
              Popular
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10 md:px-10 md:py-14">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {list.map((c) => (
            <ContentCard key={c.id} c={c} />
          ))}
        </div>
      </section>
    </main>
  );
}
