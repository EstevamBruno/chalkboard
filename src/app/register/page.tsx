"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { ApiError } from "@/lib/api";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(email, name, password);
      toast.success(t("register.success"));
      router.push("/dashboard");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 422
            ? t("register.errorValidation")
            : err.message
          : t("register.error");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow={t("register.eyebrow")}
      title={t("register.title")}
      subtitle={t("register.subtitle")}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">{t("register.name")}</Label>
          <Input
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("register.namePh")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">{t("register.email")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("register.emailPh")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">{t("register.password")}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("register.passwordPh")}
          />
        </div>
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? t("register.submitting") : t("register.submit")}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("register.already")}{" "}
        <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
          {t("register.login")}
        </Link>
      </p>
    </AuthShell>
  );
}
