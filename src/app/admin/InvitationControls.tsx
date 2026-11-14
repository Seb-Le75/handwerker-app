"use client";

import { useActionState } from "react";

import { revokeMemberInvitation, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initialState: AdminActionState = { status: "idle", message: "" };

export function InvitationControls({ invitationId, enabled }: { invitationId: string; enabled: boolean }) {
  const action = revokeMemberInvitation.bind(null, invitationId);
  const [state, submit, pending] = useActionState(action, initialState);

  return (
    <form action={submit} className="mt-3">
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        disabled={!enabled || pending}
      >
        {pending ? "Wird widerrufen …" : "Widerrufen"}
      </Button>
      {state.message ? (
        <p
          role="status"
          className={state.status === "error" ? "mt-1 text-xs text-destructive" : "mt-1 text-xs text-emerald-700"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
