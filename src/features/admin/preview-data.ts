import type { AdminOverview } from "@/features/admin/types";

export const previewAdminOverview: AdminOverview = {
  mode: "preview",
  tenant: {
    id: "preview-hansen-shk",
    legalName: "Hansen Sanitär & Heizung GmbH",
    slug: "hansen-shk",
    timezone: "Europe/Berlin",
    locale: "de-DE"
  },
  viewer: {
    membershipId: "preview-member-1",
    name: "Sebastian Hansen",
    email: "sebastian@hansen-shk.de",
    roleCode: "owner_admin",
    roleLabel: "Inhaber / Admin",
    assuranceLevel: "aal2"
  },
  tenants: [{ id: "preview-hansen-shk", name: "Hansen Sanitär & Heizung GmbH", roleCode: "owner_admin" }],
  permissions: [
    "tenant.read",
    "tenant.update",
    "members.read",
    "members.invite",
    "members.role.assign",
    "members.disable",
    "audit.read"
  ],
  members: [
    {
      id: "preview-member-1",
      name: "Sebastian Hansen",
      email: "sebastian@hansen-shk.de",
      roleCode: "owner_admin",
      roleLabel: "Inhaber / Admin",
      status: "active"
    },
    {
      id: "preview-member-2",
      name: "Mara Klein",
      email: "mara@hansen-shk.de",
      roleCode: "office_dispatch",
      roleLabel: "Büro / Disposition",
      status: "active"
    },
    {
      id: "preview-member-3",
      name: "Tobias Weber",
      email: "tobias@hansen-shk.de",
      roleCode: "technician",
      roleLabel: "Techniker",
      status: "active"
    }
  ],
  invitations: [
    {
      id: "preview-invitation-1",
      email: "lena.becker@beispiel.de",
      roleCode: "master",
      roleLabel: "Meister",
      expiresAt: "2026-11-20T12:00:00.000Z"
    }
  ],
  roles: [
    { code: "owner_admin", label: "Inhaber / Admin" },
    { code: "office_dispatch", label: "Büro / Disposition" },
    { code: "master", label: "Meister" },
    { code: "technician", label: "Monteur" },
    { code: "accounting", label: "Buchhaltung" },
    { code: "read_only", label: "Nur-Lesen" }
  ]
};
