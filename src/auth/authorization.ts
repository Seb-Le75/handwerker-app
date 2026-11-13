export const permissionCodes = [
  "tenant.read",
  "tenant.update",
  "members.read",
  "members.invite",
  "members.role.assign",
  "members.disable",
  "audit.read"
] as const;

export type PermissionCode = (typeof permissionCodes)[number];

export function hasPermission(grantedPermissions: readonly string[], permission: PermissionCode) {
  return grantedPermissions.includes(permission);
}
