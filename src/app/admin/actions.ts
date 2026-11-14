"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { withAuthenticatedTenant } from "@/features/admin/authenticated-context";
import { activeTenantCookie } from "@/features/admin/constants";
import {
  assignableRoleCodes,
  changeMemberRole,
  createInvitation,
  disableMember,
  MemberManagementError,
  revokeInvitation
} from "@/features/admin/member-service";
import { switchActiveTenant } from "@/features/admin/tenant-switch-service";

export type AdminActionState = Readonly<{
  status: "idle" | "success" | "error";
  message: string;
}>;

const roleSchema = z.enum(assignableRoleCodes);
const invitationSchema = z.object({ email: z.string().trim().toLowerCase().email(), roleCode: roleSchema });
const membershipIdSchema = z.string().uuid();

function actionError(error: unknown): AdminActionState {
  if (error instanceof MemberManagementError) return { status: "error", message: error.message };
  return { status: "error", message: "Die Aktion konnte nicht sicher ausgeführt werden." };
}

export async function inviteMember(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const parsed = invitationSchema.safeParse({ email: formData.get("email"), roleCode: formData.get("roleCode") });
  if (!parsed.success) return { status: "error", message: "Bitte E-Mail-Adresse und Rolle prüfen." };

  try {
    await withAuthenticatedTenant((database, context) => createInvitation(database, context, parsed.data));
    revalidatePath("/admin");
    return { status: "success", message: "Einladung wurde sicher vorbereitet." };
  } catch (error) {
    return actionError(error);
  }
}

export async function updateMemberRole(
  membershipId: string,
  _state: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  void _state;
  const parsedId = membershipIdSchema.safeParse(membershipId);
  const parsedRole = roleSchema.safeParse(formData.get("roleCode"));
  if (!parsedId.success || !parsedRole.success)
    return { status: "error", message: "Ungültige Mitgliedschaft oder Rolle." };

  try {
    await withAuthenticatedTenant((database, context) =>
      changeMemberRole(database, context, parsedId.data, parsedRole.data)
    );
    revalidatePath("/admin");
    return { status: "success", message: "Rolle wurde aktualisiert." };
  } catch (error) {
    return actionError(error);
  }
}

export async function deactivateMember(
  membershipId: string,
  _state: AdminActionState,
  _formData: FormData
): Promise<AdminActionState> {
  void _state;
  void _formData;
  const parsedId = membershipIdSchema.safeParse(membershipId);
  if (!parsedId.success) return { status: "error", message: "Ungültige Mitgliedschaft." };

  try {
    await withAuthenticatedTenant((database, context) => disableMember(database, context, parsedId.data));
    revalidatePath("/admin");
    return { status: "success", message: "Zugang wurde deaktiviert." };
  } catch (error) {
    return actionError(error);
  }
}

export async function revokeMemberInvitation(
  invitationId: string,
  _state: AdminActionState,
  _formData: FormData
): Promise<AdminActionState> {
  void _state;
  void _formData;
  const parsedId = membershipIdSchema.safeParse(invitationId);
  if (!parsedId.success) return { status: "error", message: "Ungültige Einladung." };

  try {
    await withAuthenticatedTenant((database, context) => revokeInvitation(database, context, parsedId.data));
    revalidatePath("/admin");
    return { status: "success", message: "Einladung wurde widerrufen." };
  } catch (error) {
    return actionError(error);
  }
}

export async function switchTenant(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  void _state;
  const parsedTenantId = membershipIdSchema.safeParse(formData.get("tenantId"));
  if (!parsedTenantId.success) return { status: "error", message: "Ungültiger Betrieb." };

  try {
    const result = await switchActiveTenant(parsedTenantId.data);
    (await cookies()).set(activeTenantCookie, result.tenantId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      priority: "high"
    });
    revalidatePath("/admin");
  } catch (error) {
    return actionError(error);
  }

  redirect("/admin");
}
