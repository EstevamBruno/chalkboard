"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/components/i18n-provider";

export function DeleteClassDialog({
  classId,
  className,
  onDeleted,
  children,
}: {
  classId: string;
  className: string;
  onDeleted?: () => void;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await api(`/api/classes/${classId}`, { method: "DELETE" });
      toast.success(t("deleteClass.success", { name: className }));
      setOpen(false);
      onDeleted?.();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 403
            ? t("deleteClass.onlyOwner")
            : err.message
          : t("deleteClass.error");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteClass.title")}</DialogTitle>
          <DialogDescription>
            <span className="font-display font-semibold text-foreground">{className}</span>
            {t("deleteClass.descAfter")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={busy}>
              {t("common.cancel")}
            </Button>
          </DialogClose>
          <Button variant="destructive" onClick={remove} disabled={busy}>
            {busy ? t("deleteClass.deleting") : t("deleteClass.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
