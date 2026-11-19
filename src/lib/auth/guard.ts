import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { forbidden, redirect } from "next/navigation";
import { cache } from "react";
import { getDb, schema } from "@/db";
import { getAuth } from ".";
import { can, isRole, type Permission, type Role } from "./permissions";

/** Current session (or null), read server-side from the request cookies. Cached per request. */
export const getSession = cache(async () => {
  // Read request headers first: it marks the route dynamic before auth (and its DB/secret
  // requirements) is touched, so `next build` never tries to prerender protected pages.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
});

const getRole = cache(async (userId: string): Promise<Role | null> => {
  const [row] = await getDb()
    .select({ key: schema.roles.key })
    .from(schema.users)
    .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
    .where(eq(schema.users.id, userId));
  return isRole(row?.key) ? row.key : null;
});

export type AdminContext = {
  user: { id: string; email: string; name: string };
  role: Role;
};

/**
 * Server-side gate for every /admin page, layout and server action (K-04, K-05).
 * Call it in each page/action — layouts don't re-run on client navigation.
 *
 * Order: signed in → role may enter the admin → temporary password replaced →
 * MFA enabled (T3) → role has `permission` (deny by default, HTTP 403).
 */
export async function requirePermission(permission: Permission): Promise<AdminContext> {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in");

  const role = await getRole(session.user.id);
  if (!can(role, "admin.access")) forbidden();

  if (session.user.mustChangePassword) redirect("/auth/change-password");
  if (!session.user.twoFactorEnabled) redirect("/auth/setup-mfa");

  if (!can(role, permission)) forbidden();

  return {
    user: { id: session.user.id, email: session.user.email, name: session.user.name },
    role: role as Role,
  };
}

/**
 * Non-throwing check for route handlers (e.g. draft preview): the admin context if the
 * request has a fully set-up session (password replaced, MFA on) with `permission`.
 */
export async function checkPermission(permission: Permission): Promise<AdminContext | null> {
  const session = await getSession();
  if (!session || session.user.mustChangePassword || !session.user.twoFactorEnabled) return null;
  const role = await getRole(session.user.id);
  if (!can(role, permission)) return null;
  return { user: { id: session.user.id, email: session.user.email, name: session.user.name }, role: role as Role };
}

/** Admin shell gate (layout): any role that may enter the admin, MFA required. */
export function requireAdminAccess() {
  return requirePermission("admin.access");
}

/** For onboarding pages (/auth/change-password, /auth/setup-mfa): signed in, any MFA state. */
export async function requireSignedIn() {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in");
  return session;
}
