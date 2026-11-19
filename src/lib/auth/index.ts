import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import { twoFactor } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import { dbSupportsTransactions, getDb, schema } from "@/db";
import { site } from "@/content/site";
import { getEmailAdapter, EmailNotConfiguredError } from "@/lib/email";
import { audit, clientIp } from "./audit";

/**
 * Better Auth (DEC-18), self-managed on Neon via Drizzle (T2 tables).
 *
 *  - Email + password only; public sign-up disabled (R1a). The owner is created with
 *    scripts/create-owner.ts.
 *  - TOTP MFA + recovery codes (K-04); required for owner/admin by src/lib/auth/guard.ts.
 *  - Sessions (K-13): HttpOnly, Secure, SameSite=Lax cookies; a new session token on every
 *    sign-in; 7-day expiry; "sign out everywhere" via /revoke-sessions.
 *  - Rate limits (K-14) stored in Postgres so they hold across serverless instances.
 *  - Audit rows (K-16) for sign-in/out, MFA, password change/reset.
 */

const SEVEN_DAYS = 60 * 60 * 24 * 7;
export const MIN_PASSWORD_LENGTH = 12;

export function authBaseURL(): string {
  return (process.env.BETTER_AUTH_URL ?? site.url).replace(/\/+$/, "");
}

function trustedOrigins(): string[] {
  const origins = [authBaseURL()];
  if (process.env.VERCEL_URL) origins.push(`https://${process.env.VERCEL_URL}`);
  if (process.env.VERCEL_BRANCH_URL) origins.push(`https://${process.env.VERCEL_BRANCH_URL}`);
  return origins;
}

/** User behind a two-factor request: the pending sign-in (2FA cookie) or the session (setup). */
async function mfaUserId(ctx: Parameters<Parameters<typeof createAuthMiddleware>[0]>[0]): Promise<string | null> {
  try {
    const cookie = ctx.context.createAuthCookie("two_factor");
    const identifier = await ctx.getSignedCookie(cookie.name, ctx.context.secret);
    if (identifier) {
      const pending = await ctx.context.internalAdapter.findVerificationValue(identifier);
      if (pending?.value) return pending.value;
    }
    return (await getSessionFromCtx(ctx))?.user.id ?? null;
  } catch {
    return null;
  }
}

const minute = 60;
/** Stricter limits than Better Auth's defaults on the sensitive endpoints. */
const rateRules = {
  "/sign-in/email": { window: 5 * minute, max: 5 },
  "/two-factor/verify-totp": { window: 5 * minute, max: 5 },
  "/two-factor/verify-backup-code": { window: 5 * minute, max: 5 },
  "/two-factor/enable": { window: 5 * minute, max: 5 },
  "/request-password-reset": { window: 15 * minute, max: 3 },
  "/reset-password": { window: 15 * minute, max: 5 },
  "/change-password": { window: 15 * minute, max: 5 },
};

function createAuth() {
  return betterAuth({
    appName: "Soft CODES",
    baseURL: authBaseURL(),
    secret: process.env.BETTER_AUTH_SECRET,
    trustedOrigins: trustedOrigins(),
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      usePlural: true,
      transaction: dbSupportsTransactions(),
      schema: {
        users: schema.users,
        sessions: schema.sessions,
        accounts: schema.accounts,
        verifications: schema.verifications,
        twoFactors: schema.twoFactors,
        rateLimits: schema.rateLimits,
      },
    }),

    emailAndPassword: {
      enabled: true,
      disableSignUp: true, // no public sign-up in R1a
      minPasswordLength: MIN_PASSWORD_LENGTH,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: 60 * 60, // 1 hour, single-use (K-03)
      revokeSessionsOnPasswordReset: true,
      async sendResetPassword({ user, token }) {
        const link = `${authBaseURL()}/auth/reset-password?token=${encodeURIComponent(token)}`;
        await getEmailAdapter().send({
          kind: "password-reset",
          to: user.email,
          subject: "Reset your Soft CODES password",
          text: `Someone asked to reset the password for ${user.email}.\n\nReset it here (valid for 1 hour, single use):\n${link}\n\nIf this wasn't you, ignore this email.`,
        });
      },
      async onPasswordReset({ user }, request) {
        await getDb()
          .update(schema.users)
          .set({ mustChangePassword: false })
          .where(eq(schema.users.id, user.id));
        await audit({ action: "auth.password_reset", userId: user.id, ip: clientIp(request?.headers) });
      },
    },

    user: {
      additionalFields: {
        roleId: { type: "number", required: true, input: false },
        mustChangePassword: { type: "boolean", required: false, defaultValue: false, input: false },
      },
    },

    session: {
      expiresIn: SEVEN_DAYS,
      updateAge: 60 * 60 * 24, // slide expiry at most once a day
    },

    advanced: {
      useSecureCookies: true,
      defaultCookieAttributes: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
      ipAddress: { ipAddressHeaders: ["x-forwarded-for", "x-real-ip"] },
    },

    rateLimit: {
      enabled: true, // also in development, so the limits are testable
      storage: "database",
      window: 60,
      max: 60,
      customRules: rateRules,
    },

    plugins: [
      twoFactor({
        issuer: "Soft CODES",
        backupCodeOptions: { amount: 10, length: 10 },
      }),
    ],

    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        // Refuse reset requests outright when email can't be sent: a clear error, and the
        // same answer for every address (no account enumeration).
        if (ctx.path === "/request-password-reset" && !getEmailAdapter().configured) {
          throw new APIError("SERVICE_UNAVAILABLE", {
            code: new EmailNotConfiguredError().code,
            message: "Password reset email is not configured on this server yet.",
          });
        }
      }),
      after: createAuthMiddleware(async (ctx) => {
        const ip = clientIp(ctx.request?.headers ?? ctx.headers);
        const newSession = ctx.context.newSession;
        const returned = ctx.context.returned as unknown;
        const failed = returned instanceof APIError;
        const body = (ctx.body ?? {}) as Record<string, unknown>;

        switch (ctx.path) {
          case "/sign-in/email": {
            const email = String(body.email ?? "").toLowerCase();
            if (failed) {
              await audit({ action: "auth.sign_in_failed", ip, data: { email } });
            } else if (newSession) {
              // This hook runs before the twoFactor plugin swaps the session for an MFA
              // challenge, so a user with MFA on has only passed the password step.
              const mfa = Boolean((newSession.user as { twoFactorEnabled?: boolean }).twoFactorEnabled);
              await audit(
                mfa
                  ? { action: "auth.mfa_challenge", userId: newSession.user.id, ip, data: { email } }
                  : { action: "auth.sign_in", userId: newSession.user.id, ip, data: { method: "password" } },
              );
            }
            return;
          }
          case "/two-factor/verify-totp":
          case "/two-factor/verify-backup-code": {
            const method = ctx.path.endsWith("totp") ? "totp" : "backup_code";
            if (failed) {
              await audit({ action: "auth.mfa_failed", userId: await mfaUserId(ctx), ip, data: { method } });
              return;
            }
            if (!newSession) return;
            // A request that already carried a session cookie is confirming MFA setup;
            // otherwise it is the second step of a sign-in.
            const cookieHeader = ctx.request?.headers.get("cookie") ?? ctx.headers?.get("cookie") ?? "";
            const hadSession = cookieHeader.includes(`${ctx.context.authCookies.sessionToken.name}=`);
            await audit(
              hadSession
                ? { action: "auth.mfa_enabled", userId: newSession.user.id, ip, data: { method } }
                : { action: "auth.sign_in", userId: newSession.user.id, ip, data: { method: `password+${method}` } },
            );
            return;
          }
          case "/change-password": {
            const userId = ctx.context.session?.user.id ?? newSession?.user.id;
            if (failed || !userId) return;
            await getDb()
              .update(schema.users)
              .set({ mustChangePassword: false })
              .where(eq(schema.users.id, userId));
            await audit({ action: "auth.password_changed", userId, ip });
            return;
          }
          case "/request-password-reset": {
            if (!failed) {
              await audit({ action: "auth.password_reset_requested", ip, data: { email: String(body.email ?? "").toLowerCase() } });
            }
            return;
          }
          case "/revoke-sessions": {
            if (!failed) await audit({ action: "auth.sign_out_everywhere", userId: ctx.context.session?.user.id, ip });
            return;
          }
        }
      }),
    },

    databaseHooks: {
      session: {
        delete: {
          // Sign-out deletes the current session row.
          async after(session, ctx) {
            if (ctx?.path === "/sign-out") {
              await audit({ action: "auth.sign_out", userId: session.userId, ip: clientIp(ctx.request?.headers) });
            }
          },
        },
      },
    },

    telemetry: { enabled: false },
  });
}

export type Auth = ReturnType<typeof createAuth>;
let auth: Auth | undefined;

/** Lazily created, so `next build` and pages that don't use auth need no secrets. */
export function getAuth(): Auth {
  auth ??= createAuth();
  return auth;
}
