"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Wifi, WifiOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { useI18n } from "@/components/i18n-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { api, ApiError } from "@/lib/api";
import { Canvas } from "@/components/board/canvas";
import { Toolbar } from "@/components/board/toolbar";
import { InviteDialog } from "@/components/board/invite-dialog";
import { DeleteClassDialog } from "@/components/delete-class-dialog";
import { useBoard } from "@/components/board/use-board";
import type { FontKey, Tool } from "@/components/board/types";

interface ClassDetail {
  id: string;
  name: string;
  isOwner: boolean;
  owner: { name: string };
  members: { id: string; name: string; role: string }[];
}

export default function ClassPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const [detail, setDetail] = useState<ClassDetail | null>(null);
  const [loadError, setLoadError] = useState<"notMember" | "loadError" | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#f4f1e8");
  const [width, setWidth] = useState(4);
  const [font, setFont] = useState<FontKey>("sans");

  const { elements, conn, send } = useBoard(id);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const loadDetail = useCallback(async () => {
    try {
      const { class: c } = await api<{ class: ClassDetail }>(`/api/classes/${id}`);
      setDetail(c);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setLoadError("notMember");
      } else {
        setLoadError("loadError");
      }
    }
  }, [id]);

  useEffect(() => {
    if (user) loadDetail();
  }, [user, loadDetail]);

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted-foreground">
        {t("common.loading")}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div>
          <h1 className="font-display text-3xl font-semibold">{t("classPage.cantOpenTitle")}</h1>
          <p className="mt-2 text-muted-foreground">
            {loadError === "notMember" ? t("classPage.notMember") : t("classPage.loadError")}
          </p>
          <Button asChild className="mt-6">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" /> {t("classPage.backToDashboard")}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-4 border-b border-border bg-background/90 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/dashboard" title={t("classPage.back")}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-display text-lg font-semibold leading-tight">
              {detail?.name ?? t("common.loading")}
            </h1>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              {t("classPage.membersCount", { count: detail?.members.length ?? 0 })} ·{" "}
              {t("classPage.id")}&nbsp;
              <code className="rounded bg-secondary px-1 py-0.5 text-[10px]">{id}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <ConnBadge conn={conn} />
          {detail?.isOwner && (
            <>
              <InviteDialog classId={id} onInvited={loadDetail} />
              <DeleteClassDialog
                classId={id}
                className={detail.name}
                onDeleted={() => router.replace("/dashboard")}
              >
                <Button variant="ghost" size="icon" title={t("classPage.deleteClass")}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </DeleteClassDialog>
            </>
          )}
        </div>
      </header>

      {/* Board area */}
      <div className="relative flex-1 overflow-hidden p-3">
        <div
          className="relative h-full w-full overflow-hidden rounded-2xl border border-[hsl(162_14%_22%)] shadow-lift"
          style={{ background: "linear-gradient(160deg, hsl(162 16% 16%), hsl(162 18% 11%))" }}
        >
          {conn === "denied" ? (
            <div className="grid h-full place-items-center text-[hsl(42_30%_78%)]">
              {t("classPage.noAccess")}
            </div>
          ) : (
            <Canvas
              elements={elements}
              tool={tool}
              color={color}
              width={width}
              font={font}
              onOp={send}
            />
          )}
        </div>

        {/* Floating toolbar */}
        {conn !== "denied" && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
            <div className="pointer-events-auto">
              <Toolbar
                tool={tool}
                setTool={setTool}
                color={color}
                setColor={setColor}
                width={width}
                setWidth={setWidth}
                font={font}
                setFont={setFont}
                onClear={() => {
                  if (confirm(t("classPage.clearConfirm"))) send({ op: "clear" });
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ConnBadge({ conn }: { conn: string }) {
  const { t } = useI18n();
  const styles: Record<string, { cls: string; live: boolean }> = {
    connecting: { cls: "bg-secondary text-secondary-foreground", live: false },
    connected: { cls: "bg-[hsl(140_50%_90%)] text-[hsl(140_50%_24%)]", live: true },
    denied: { cls: "bg-destructive/15 text-destructive", live: false },
    error: { cls: "bg-destructive/15 text-destructive", live: false },
  };
  const s = styles[conn] ?? styles.connecting;
  const label = t(`classPage.conn.${conn in styles ? conn : "connecting"}`);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.cls}`}
    >
      {s.live ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
      {label}
    </span>
  );
}
