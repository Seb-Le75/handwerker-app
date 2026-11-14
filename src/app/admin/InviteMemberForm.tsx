"use client";

import { useActionState } from "react";
import { MailPlus } from "lucide-react";

import { inviteMember, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminRole } from "@/features/admin/types";

const initialState: AdminActionState = { status: "idle", message: "" };

export function InviteMemberForm({ roles, preview }: { roles: AdminRole[]; preview: boolean }) {
  const [state, action, pending] = useActionState(inviteMember, initialState);

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-[1fr_13rem_auto] sm:items-end">
      <div className="space-y-2">
        <Label htmlFor="invite-email">E-Mail-Adresse</Label>
        <Input id="invite-email" name="email" type="email" placeholder="name@betrieb.de" required disabled={preview} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="invite-role">Rolle</Label>
        <select
          id="invite-role"
          name="roleCode"
          className="min-h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
          disabled={preview}
        >
          {roles.map((role) => (
            <option key={role.code} value={role.code}>
              {role.label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={preview || pending}>
        <MailPlus className="h-4 w-4" />
        {pending ? "Wird angelegt …" : "Einladen"}
      </Button>
      {state.message ? (
        <p
          role="status"
          className={
            state.status === "error"
              ? "text-sm text-destructive sm:col-span-3"
              : "text-sm text-emerald-700 sm:col-span-3"
          }
        >
          {state.message}
        </p>
      ) : null}
      {preview ? (
        <p className="text-xs text-amber-800 sm:col-span-3">
          In der Vorschau ist das Formular sichtbar, speichert aber keine Einladung.
        </p>
      ) : null}
    </form>
  );
}
