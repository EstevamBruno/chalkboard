"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PencilLine, Shapes, Users, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [loading, user, router]);

  return (
    <main className="relative min-h-dvh overflow-hidden">
      {/* Decorative chalk-green slab bleeding off the right edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 -top-40 h-[42rem] w-[42rem] rounded-full opacity-90 blur-[2px]"
        style={{
          background:
            "radial-gradient(circle at 35% 35%, hsl(162 16% 18%), hsl(162 18% 12%))",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-24 top-28 hidden font-hand text-3xl text-[hsl(42_38%_92%)] lg:block rotate-[-6deg]"
      >
        x² + y² = r²
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground font-display text-lg">
            C
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Chalkboard
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <LanguageSwitcher className="mr-1" />
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">{t("landing.login")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/register">{t("landing.getStarted")}</Link>
          </Button>
        </nav>
      </header>

      <section className="relative z-10 mx-auto grid max-w-6xl items-center gap-12 px-6 pb-24 pt-10 lg:grid-cols-[1.1fr_0.9fr] lg:pt-20">
        <div className="stagger">
          <p
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground"
            style={{ animationDelay: "40ms" }}
          >
            <Radio className="h-3.5 w-3.5 text-accent" /> {t("landing.badge")}
          </p>
          <h1
            className="font-display text-5xl font-semibold leading-[0.98] tracking-tight sm:text-6xl lg:text-7xl"
            style={{ animationDelay: "120ms" }}
          >
            {t("landing.titleA")}
            <br />
            {t("landing.titleEveryone")}{" "}
            <span className="chalk-underline">{t("landing.titleHighlight")}</span>.
          </h1>
          <p
            className="mt-6 max-w-md text-lg leading-relaxed text-muted-foreground"
            style={{ animationDelay: "220ms" }}
          >
            {t("landing.subtitle")}
          </p>
          <div className="mt-9 flex flex-wrap gap-3" style={{ animationDelay: "320ms" }}>
            <Button asChild size="lg">
              <Link href="/register">{t("landing.ctaCreate")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">{t("landing.ctaLogin")}</Link>
            </Button>
          </div>

          <ul
            className="mt-12 grid max-w-md grid-cols-2 gap-x-6 gap-y-4"
            style={{ animationDelay: "420ms" }}
          >
            {[
              { icon: PencilLine, label: t("landing.featDraw") },
              { icon: Shapes, label: t("landing.featShapes") },
              { icon: Users, label: t("landing.featInvite") },
              { icon: Radio, label: t("landing.featSync") },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-secondary text-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Mock board preview */}
        <div
          className="stagger relative aspect-[4/3] w-full rounded-2xl border border-[hsl(162_16%_22%)] p-4 shadow-lift"
          style={{
            animationDelay: "260ms",
            background:
              "linear-gradient(160deg, hsl(162 16% 16%), hsl(162 18% 11%))",
          }}
        >
          <div className="flex items-center gap-1.5 pb-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(38_74%_55%)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(42_30%_70%)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[hsl(42_20%_45%)]" />
            <span className="ml-3 font-hand text-lg text-[hsl(42_38%_88%)]">
              {t("landing.mockClass")}
            </span>
          </div>
          <svg viewBox="0 0 400 280" className="h-[calc(100%-2rem)] w-full">
            <path
              d="M30 220 Q120 60 210 150 T380 90"
              fill="none"
              stroke="hsl(38 74% 58%)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="120" cy="120" r="42" fill="none" stroke="hsl(42 38% 90%)" strokeWidth="3" />
            <rect x="250" y="160" width="90" height="70" fill="none" stroke="hsl(42 38% 90%)" strokeWidth="3" rx="4" />
            <line x1="40" y1="250" x2="370" y2="250" stroke="hsl(42 20% 55%)" strokeWidth="2" strokeDasharray="2 8" />
            <text x="120" y="125" textAnchor="middle" fill="hsl(42 38% 90%)" fontFamily="var(--font-hand)" fontSize="22">
              πr²
            </text>
          </svg>
        </div>
      </section>
    </main>
  );
}
