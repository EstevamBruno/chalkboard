"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
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
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/components/i18n-provider";

export function InviteDialog({ classId, onInvited }: { classId: string; onInvited?: () => void }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/classes/${classId}/invitations`, {
        method: "POST",
        body: { email: email.trim() },
      });
      toast.success(t("invite.sent", { email: email.trim() }));
      setEmail("");
      setOpen(false);
      onInvited?.();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 404
            ? t("invite.noUser")
            : err.message
          : t("invite.error");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="h-4 w-4" /> {t("invite.invite")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("invite.title")}</DialogTitle>
          <DialogDescription>{t("invite.desc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={invite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteEmail">{t("invite.email")}</Label>
            <Input
              id="inviteEmail"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("invite.emailPh")}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={busy || !email.trim()}>
              {busy ? t("invite.sending") : t("invite.send")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
