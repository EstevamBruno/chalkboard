"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, LogOut, ArrowUpRight, Users, Mail, Check, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { DeleteClassDialog } from "@/components/delete-class-dialog";
import { api, ApiError } from "@/lib/api";

interface ClassItem {
  id: string;
  name: string;
  isOwner: boolean;
  memberCount: number;
}
interface Invitation {
  id: string;
  class: { id: string; name: string };
  inviter: { name: string; email: string };
}

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const refresh = useCallback(async () => {
    try {
      const [c, i] = await Promise.all([
        api<{ classes: ClassItem[] }>("/api/classes"),
        api<{ invitations: Invitation[] }>("/api/invitations"),
      ]);
      setClasses(c.classes);
      setInvitations(i.invitations);
    } catch {
      // session may have expired; provider handles redirect
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) refresh();
  }, [user, refresh]);

  async function createClass(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { class: created } = await api<{ class: ClassItem }>("/api/classes", {
        method: "POST",
        body: { name: newName.trim() },
      });
      setNewName("");
      setDialogOpen(false);
      toast.success(t("dashboard.created", { name: created.name }));
      router.push(`/class/${created.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("dashboard.createError"));
    } finally {
      setCreating(false);
    }
  }

  async function respond(id: string, action: "accept" | "decline") {
    try {
      await api(`/api/invitations/${id}/${action}`, { method: "POST" });
      toast.success(action === "accept" ? t("dashboard.joined") : t("dashboard.declined"));
      refresh();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("dashboard.actionError"));
    }
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-display">
              C
            </span>
            <span className="font-display text-lg font-semibold">Chalkboard</span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <span className="hidden text-sm text-muted-foreground sm:inline">{user.name}</span>
            <Button variant="ghost" size="icon" onClick={logout} title={t("dashboard.logout")}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Pending invitations */}
        {invitations.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Mail className="h-3.5 w-3.5 text-accent" /> {t("dashboard.invitations")}
            </h2>
            <ul className="space-y-3">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3"
                >
                  <div className="text-sm">
                    {t("dashboard.invitedYouTo", { name: inv.inviter.name })}{" "}
                    <span className="font-display font-semibold">{inv.class.name}</span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" variant="accent" onClick={() => respond(inv.id, "accept")}>
                      <Check className="h-4 w-4" /> {t("dashboard.accept")}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => respond(inv.id, "decline")}>
                      <X className="h-4 w-4" /> {t("dashboard.decline")}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Header row */}
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">
              {t("dashboard.yourClasses")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {classes.length
                ? t(classes.length === 1 ? "dashboard.countOne" : "dashboard.countOther", {
                    count: classes.length,
                  })
                : t("dashboard.noClasses")}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> {t("dashboard.newClass")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("dashboard.createTitle")}</DialogTitle>
                <DialogDescription>{t("dashboard.createDesc")}</DialogDescription>
              </DialogHeader>
              <form onSubmit={createClass} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="className">{t("dashboard.classNameLabel")}</Label>
                  <Input
                    id="className"
                    autoFocus
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t("dashboard.classNamePh")}
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={creating || !newName.trim()}>
                    {creating ? t("dashboard.creating") : t("dashboard.create")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Classes grid */}
        {dataLoading ? (
          <p className="text-sm text-muted-foreground">{t("dashboard.loadingClasses")}</p>
        ) : classes.length === 0 ? (
          <EmptyState onCreate={() => setDialogOpen(true)} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classes.map((c) => (
              <li key={c.id} className="group relative">
                <Link
                  href={`/class/${c.id}`}
                  className="block h-full rounded-lg border border-border bg-card p-5 shadow-chalk transition-all hover:-translate-y-0.5 hover:shadow-lift"
                >
                  <div className="mb-8 flex items-start justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${
                        c.isOwner
                          ? "bg-accent/20 text-accent-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {c.isOwner ? t("common.owner") : t("common.memberRole")}
                    </span>
                    {!c.isOwner && (
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    )}
                  </div>
                  <h3 className="font-display text-xl font-semibold leading-tight">{c.name}</h3>
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {c.memberCount} {c.memberCount === 1 ? t("common.member") : t("common.members")}
                  </p>
                </Link>

                {c.isOwner && (
                  <DeleteClassDialog classId={c.id} className={c.name} onDeleted={refresh}>
                    <button
                      title={t("classPage.deleteClass")}
                      className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </DeleteClassDialog>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  const { t } = useI18n();
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-border bg-card/50 px-6 py-20 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-full bg-secondary">
        <Plus className="h-6 w-6" />
      </div>
      <h3 className="font-display text-2xl font-semibold">{t("dashboard.emptyTitle")}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{t("dashboard.emptyDesc")}</p>
      <Button className="mt-6" onClick={onCreate}>
        <Plus className="h-4 w-4" /> {t("dashboard.newClass")}
      </Button>
    </div>
  );
}
