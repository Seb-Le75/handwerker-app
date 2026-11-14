"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { requestPasswordReset, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = { status: "idle", message: "" };

export function ForgotPasswordForm({ enabled }: { enabled: boolean }) {
  const [state, action, pending] = useActionState(requestPasswordReset, initialState);
  return (
    <form action={action} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-Mail-Adresse</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required disabled={!enabled} />
      </div>
      {state.message ? (
        <p role={state.status === "error" ? "alert" : "status"} className="rounded-md bg-muted px-4 py-3 text-sm">
          {state.message}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={!enabled || pending}>
        {pending ? "Anfrage wird gesendet …" : "Link anfordern"}
      </Button>
    </form>
  );
}
