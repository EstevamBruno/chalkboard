"use client";

import { useI18n, type Locale } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "pt", label: "PT" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-card p-0.5",
        className
      )}
      role="group"
      aria-label={t("lang.label")}
    >
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => setLocale(o.value)}
          aria-pressed={locale === o.value}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide transition-colors",
            locale === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
