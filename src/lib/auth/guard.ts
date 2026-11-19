import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDb, schema } from "@/db";
import { getAuth } from ".";

export const ADMIN_ROLES = ["owner", "admin"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

/** Current session (or null), read server-side from the request cookies. */
export async function getSession() {
  // Read request headers first: it marks the route dynamic before auth (and its DB/secret
  // requirements) is touched, so `next build` never tries to prerender protected pages.
  const requestHeaders = await headers();
  return getAuth().api.getSession({ headers: requestHeaders });
}

/**
 * Server-side gate for every /admin route (K-04, K-05). Call it at the top of each admin
 * page or server action — not only in a layout, which doesn't re-run on navigation.
 *
 * Order: signed in → owner/admin role → temporary password replaced → MFA enabled.
 */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in");

  const [row] = await getDb()
    .select({ key: schema.roles.key })
    .from(schema.users)
    .innerJoin(schema.roles, eq(schema.users.roleId, schema.roles.id))
    .where(eq(schema.users.id, session.user.id));
  const role = row?.key;
  if (!role || !(ADMIN_ROLES as readonly string[]).includes(role)) redirect("/auth/sign-in?error=forbidden");

  if (session.user.mustChangePassword) redirect("/auth/change-password");
  if (!session.user.twoFactorEnabled) redirect("/auth/setup-mfa");

  return { session, role: role as AdminRole };
}

/** For onboarding pages (/auth/change-password, /auth/setup-mfa): signed in, any MFA state. */
export async function requireSignedIn() {
  const session = await getSession();
  if (!session) redirect("/auth/sign-in");
  return session;
}
