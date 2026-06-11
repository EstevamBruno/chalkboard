"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      {/* Left: chalk-green panel with hand-drawn flourish */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex"
        style={{ background: "linear-gradient(155deg, hsl(162 16% 16%), hsl(162 18% 10%))" }}
      >
        <Link href="/" className="relative z-10 flex items-center gap-2 text-[hsl(42_38%_92%)]">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-accent text-accent-foreground font-display text-lg">
            C
          </span>
          <span className="font-display text-xl font-semibold">Chalkboard</span>
        </Link>

        <svg viewBox="0 0 400 300" className="relative z-10 my-auto w-full max-w-sm self-center">
          <path d="M20 200 Q120 40 220 160 T390 70" fill="none" stroke="hsl(38 74% 58%)" strokeWidth="3" strokeLinecap="round" />
          <circle cx="150" cy="150" r="55" fill="none" stroke="hsl(42 38% 88%)" strokeWidth="3" />
          <rect x="250" y="150" width="100" height="90" rx="6" fill="none" stroke="hsl(42 38% 88%)" strokeWidth="3" />
          <text x="150" y="158" textAnchor="middle" fill="hsl(42 38% 90%)" fontFamily="var(--font-hand)" fontSize="28">
            A=πr²
          </text>
        </svg>

        <p className="relative z-10 max-w-xs font-hand text-2xl leading-snug text-[hsl(42_38%_90%)]">
          {t("authShell.quote")}
        </p>
      </aside>

      {/* Right: form */}
      <section className="relative flex items-center justify-center px-6 py-16">
        <LanguageSwitcher className="absolute right-6 top-6" />
        <div className="w-full max-w-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-accent">
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight">
            {title}
          </h1>
          <p className="mb-8 mt-2 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </section>
    </main>
  );
}
