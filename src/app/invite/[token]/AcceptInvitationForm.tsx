"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";

import { acceptMemberInvitation, type AcceptInvitationState } from "./actions";

const initialState: AcceptInvitationState = { message: "" };

export function AcceptInvitationForm({ token }: { token: string }) {
  const action = acceptMemberInvitation.bind(null, token);
  const [state, formAction, pending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {state.message}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Einladung wird geprüft …" : "Einladung annehmen"}
      </Button>
    </form>
  );
}
