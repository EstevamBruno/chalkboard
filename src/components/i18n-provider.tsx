"use client";

import * as React from "react";
import { en } from "@/lib/i18n/en";
import { pt } from "@/lib/i18n/pt";

export type Locale = "en" | "pt";

const dicts = { en, pt } as const;
const STORAGE_KEY = "chalkboard_locale";

interface I18nContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

function lookup(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => {
    if (o && typeof o === "object") return (o as Record<string, unknown>)[k];
    return undefined;
  }, obj);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>("en");

  // Detect saved preference or browser language on mount.
  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "pt") {
      setLocaleState(saved);
      return;
    }
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("pt")) setLocaleState("pt");
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEY, l);
  }, []);

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let value = lookup(dicts[locale], key);
      if (typeof value !== "string") value = lookup(dicts.en, key); // fall back to English
      if (typeof value !== "string") return key;
      let out = value;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          out = out.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return out;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
