/**
 * Role-based access control (G-03, K-05) — the single source of truth.
 *
 * Deny by default: a role has a permission only if it is listed here. Every admin page
 * and server action checks a permission server-side (src/lib/auth/guard.ts).
 * Pure module (no server imports) so it can be unit-tested and shared with the UI.
 */

export const ROLES = ["owner", "admin", "staff", "client"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "admin.access", // may enter /admin at all
  "dashboard.view",
  "content.manage", // T5
  "projects.manage", // T5
  "media.manage", // T5
  "pricing.manage", // T6
  "leads.view", // T7
  "audit.view",
  "settings.view",
  "settings.write",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const MATRIX: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,
  admin: [
    "admin.access",
    "dashboard.view",
    "content.manage",
    "projects.manage",
    "media.manage",
    "pricing.manage",
    "leads.view",
    "audit.view",
  ],
  staff: ["admin.access", "dashboard.view", "projects.manage", "leads.view"],
  client: [], // client portal is R2 (F-02); no admin access
};

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/** True only if `role` is a known role that is explicitly granted `permission`. */
export function can(role: unknown, permission: Permission): boolean {
  if (!isRole(role)) return false;
  return MATRIX[role].includes(permission);
}

export function permissionsFor(role: unknown): Permission[] {
  return isRole(role) ? [...MATRIX[role]] : [];
}

/** Admin navigation. Each entry is protected by `permission`; `release` marks later tasks. */
export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard", permission: "dashboard.view", release: null },
  { href: "/admin/content", label: "Content", permission: "content.manage", release: "T5" },
  { href: "/admin/projects", label: "Projects", permission: "projects.manage", release: "T5" },
  { href: "/admin/pricing", label: "Pricing", permission: "pricing.manage", release: "T6" },
  { href: "/admin/leads", label: "Leads", permission: "leads.view", release: "T7" },
  { href: "/admin/media", label: "Media", permission: "media.manage", release: "T5" },
  { href: "/admin/audit", label: "Audit log", permission: "audit.view", release: null },
  { href: "/admin/settings", label: "Settings", permission: "settings.view", release: null },
] as const satisfies readonly {
  href: string;
  label: string;
  permission: Permission;
  release: "T5" | "T6" | "T7" | null;
}[];

export type AdminNavItem = (typeof ADMIN_NAV)[number];

/** Permission required for an /admin path (unknown admin paths: deny). */
export function permissionForPath(pathname: string): Permission | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  const exact = ADMIN_NAV.find((i) => i.href === path);
  if (exact) return exact.permission;
  const prefix = ADMIN_NAV.filter((i) => i.href !== "/admin").find((i) => path.startsWith(`${i.href}/`));
  return prefix?.permission ?? null;
}

export class ForbiddenError extends Error {
  constructor(public readonly permission: Permission) {
    super(`Forbidden: missing permission ${permission}`);
    this.name = "ForbiddenError";
  }
}

/** Throw unless `role` has `permission` (for server actions and service functions). */
export function assertCan(role: unknown, permission: Permission): void {
  if (!can(role, permission)) throw new ForbiddenError(permission);
}
