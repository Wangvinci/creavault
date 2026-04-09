"use client";

import { createContext, useContext, useState, useCallback, useMemo } from "react";
import en from "./en.json";
import zh from "./zh.json";
import React from "react";

export type Locale = "en" | "zh";

const messages: Record<Locale, typeof en> = { en, zh };

type I18nContext = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<I18nContext>({
  locale: "en",
  setLocale: () => {},
  t: (k) => k,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    try {
      const saved = localStorage.getItem("creavault:locale");
      if (saved === "zh" || saved === "en") return saved;
    } catch {}
    return navigator.language.startsWith("zh") ? "zh" : "en";
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try { localStorage.setItem("creavault:locale", l); } catch {}
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const parts = key.split(".");
      let val: unknown = messages[locale];
      for (const p of parts) {
        if (val && typeof val === "object" && p in val) {
          val = (val as Record<string, unknown>)[p];
        } else {
          return key; // fallback: return the key itself
        }
      }
      let str = typeof val === "string" ? val : key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          str = str.replace(`{${k}}`, String(v));
        }
      }
      return str;
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return React.createElement(Ctx.Provider, { value }, children);
}

export function useI18n() {
  return useContext(Ctx);
}
