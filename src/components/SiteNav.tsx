"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useI18n, type Locale } from "@/i18n";

const linkKeys = [
  { href: "/dashboard", key: "nav.dashboard" },
  { href: "/explore", key: "nav.explore" },
  { href: "/upload", key: "nav.upload" },
  { href: "/vault", key: "nav.vault" },
  { href: "/token", key: "nav.token" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t, locale, setLocale } = useI18n();

  const toggleLocale = () => setLocale(locale === "en" ? "zh" : "en");

  return (
    <>
      <nav className="relative z-50 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-10">
          <Link
            href="/"
            className="text-[15px] font-semibold tracking-tight"
            onClick={() => setOpen(false)}
          >
            creavault<span className="text-violet-400">.</span>
          </Link>
          <div className="hidden items-center gap-7 text-[13px] md:flex">
            {linkKeys.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={
                  pathname === l.href
                    ? "text-white"
                    : "text-white/55 transition hover:text-white"
                }
              >
                {t(l.key)}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* locale toggle */}
          <button
            onClick={toggleLocale}
            className="hidden rounded-md border border-white/10 px-2 py-1 text-[11px] text-white/55 transition hover:border-white/25 hover:text-white sm:block"
            title="Switch language"
          >
            {locale === "en" ? "中文" : "EN"}
          </button>
          <div className="hidden sm:block">
            <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
          </div>
          {/* mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 md:hidden"
            aria-label="Menu"
          >
            <div className="flex flex-col gap-[5px]">
              <span
                className={`block h-px w-4 bg-white transition-all duration-200 ${
                  open ? "translate-y-[3px] rotate-45" : ""
                }`}
              />
              <span
                className={`block h-px w-4 bg-white transition-all duration-200 ${
                  open ? "-translate-y-[3px] -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </nav>

      {/* mobile menu overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-[#0a0a0e]/95 backdrop-blur-xl md:hidden">
          <div className="flex flex-col items-center justify-center gap-1 pt-24">
            {linkKeys.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`w-full px-8 py-4 text-center text-xl font-medium tracking-tight transition ${
                  pathname === l.href
                    ? "text-white"
                    : "text-white/55 active:text-white"
                }`}
              >
                {t(l.key)}
              </Link>
            ))}
            <button
              onClick={toggleLocale}
              className="mt-4 rounded-full border border-white/15 px-5 py-2 text-[13px] text-white/70"
            >
              {locale === "en" ? "切换中文" : "Switch to English"}
            </button>
            <div className="mt-4">
              <ConnectButton accountStatus="address" chainStatus="icon" showBalance={false} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
