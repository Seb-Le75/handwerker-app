import type { PermissionCode } from "@/auth/authorization";

export type AdminMember = Readonly<{
  id: string;
  name: string;
  email: string;
  roleCode: string;
  roleLabel: string;
  status: "active" | "disabled";
}>;

export type AdminTenantOption = Readonly<{
  id: string;
  name: string;
  roleCode: string;
}>;

export type AdminOverview = Readonly<{
  mode: "live" | "preview";
  tenant: {
    id: string;
    legalName: string;
    slug: string;
    timezone: string;
    locale: string;
  };
  viewer: {
    name: string;
    email: string;
    roleCode: string;
    roleLabel: string;
    assuranceLevel: string;
  };
  tenants: AdminTenantOption[];
  permissions: PermissionCode[];
  members: AdminMember[];
}>;
