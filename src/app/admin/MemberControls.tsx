"use client";

import { useActionState } from "react";

import { deactivateMember, type AdminActionState, updateMemberRole } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { AdminRole } from "@/features/admin/types";

const initialState: AdminActionState = { status: "idle", message: "" };

export function MemberControls({
  membershipId,
  currentRole,
  roles,
  canChangeRole,
  canDisable
}: {
  membershipId: string;
  currentRole: string;
  roles: AdminRole[];
  canChangeRole: boolean;
  canDisable: boolean;
}) {
  const roleAction = updateMemberRole.bind(null, membershipId);
  const disableAction = deactivateMember.bind(null, membershipId);
  const [roleState, submitRole, rolePending] = useActionState(roleAction, initialState);
  const [disableState, submitDisable, disablePending] = useActionState(disableAction, initialState);
  const message = roleState.message || disableState.message;
  const isError = roleState.status === "error" || disableState.status === "error";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={submitRole} className="flex items-center gap-2">
          <select
            aria-label="Rolle ändern"
            name="roleCode"
            defaultValue={currentRole}
            className="h-10 rounded-md border bg-white px-2 text-sm"
            disabled={!canChangeRole || rolePending}
          >
            {roles.map((role) => (
              <option key={role.code} value={role.code}>
                {role.label}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="outline" disabled={!canChangeRole || rolePending}>
            Speichern
          </Button>
        </form>
        <form action={submitDisable}>
          <Button
            type="submit"
            size="sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={!canDisable || disablePending}
          >
            Deaktivieren
          </Button>
        </form>
      </div>
      {message ? (
        <p role="status" className={isError ? "text-xs text-destructive" : "text-xs text-emerald-700"}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
