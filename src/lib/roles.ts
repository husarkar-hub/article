import { AdminRole } from "@prisma/client";

type AdminRoleRecord = Record<string, AdminRole>;

const adminRoleRecord = AdminRole as AdminRoleRecord;

export const SUPER_ADMIN_ROLE: AdminRole =
  adminRoleRecord?.SUPER_ADMIN ?? ("SUPER_ADMIN" as AdminRole);

export const ADMIN_ROLE: AdminRole =
  adminRoleRecord?.ADMIN ?? ("ADMIN" as AdminRole);

export const EDITOR_ROLE: AdminRole =
  adminRoleRecord?.EDITOR ?? ("EDITOR" as AdminRole);

export const STAFF_ROLES: AdminRole[] = [
  SUPER_ADMIN_ROLE,
  ADMIN_ROLE,
  EDITOR_ROLE,
];

export function normalizeAdminRole(value: unknown): AdminRole | null {
  if (typeof value !== "string") {
    return null;
  }

  const candidate = value
    .toUpperCase()
    .replace(/[\s-]+/g, "_")
    .trim();

  if (candidate === SUPER_ADMIN_ROLE) {
    return SUPER_ADMIN_ROLE;
  }

  if (candidate === ADMIN_ROLE) {
    return ADMIN_ROLE;
  }

  if (candidate === EDITOR_ROLE) {
    return EDITOR_ROLE;
  }

  return null;
}

export function isSuperAdmin(role: unknown): role is AdminRole {
  return role === SUPER_ADMIN_ROLE;
}

export function isStaff(role: unknown): role is AdminRole {
  return STAFF_ROLES.includes(role as AdminRole);
}
