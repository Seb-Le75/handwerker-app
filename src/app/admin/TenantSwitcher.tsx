"use client";

import { useActionState } from "react";
import { Building2 } from "lucide-react";

import { switchTenant, type AdminActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { AdminTenantOption } from "@/features/admin/types";

const initialState: AdminActionState = { status: "idle", message: "" };

export function TenantSwitcher({
  activeTenantId,
  tenants,
  preview
}: {
  activeTenantId: string;
  tenants: AdminTenantOption[];
  preview: boolean;
}) {
  const [state, action, pending] = useActionState(switchTenant, initialState);

  return (
    <form action={action} className="flex flex-col gap-2 sm:flex-row sm:items-end">
      <label className="space-y-1 text-sm font-semibold">
        <span className="block">Aktiver Betrieb</span>
        <select
          name="tenantId"
          defaultValue={activeTenantId}
          className="min-h-12 min-w-64 rounded-md border bg-white px-3 font-normal"
          disabled={preview || pending}
        >
          {tenants.map((tenant) => (
            <option key={tenant.id} value={tenant.id}>
              {tenant.name}
            </option>
          ))}
        </select>
      </label>
      <Button type="submit" variant="outline" disabled={preview || pending || tenants.length < 2}>
        <Building2 className="h-4 w-4" />
        {pending ? "Wechsel läuft …" : "Betrieb wechseln"}
      </Button>
      {state.message ? <p className="text-xs text-destructive sm:basis-full">{state.message}</p> : null}
    </form>
  );
}
