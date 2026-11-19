import { z } from "zod";

/** Audit log viewer filters (G-19), parsed from URL search params. Pure module. */
export const AUDIT_PAGE_SIZE = 25;
/** Actor filter value for entries with no user (system, scripts, failed sign-ins). */
export const SYSTEM_ACTOR = "system";

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00Z`)), "invalid date");

export const auditFiltersSchema = z.object({
  actor: z.string().max(100).optional(),
  action: z
    .string()
    .max(100)
    .regex(/^[a-z0-9_.]+$/)
    .optional(),
  from: day.optional(),
  to: day.optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
});
export type AuditFilters = z.output<typeof auditFiltersSchema>;

/** Lenient parse for URLs: invalid or empty values are dropped instead of erroring. */
export function parseAuditFilters(params: Record<string, string | string[] | undefined>): AuditFilters {
  const clean: Record<string, string> = {};
  for (const key of ["actor", "action", "from", "to", "page"] as const) {
    const v = params[key];
    const value = Array.isArray(v) ? v[0] : v;
    if (value && value.trim() !== "") {
      const one = auditFiltersSchema.shape[key].safeParse(value.trim());
      if (one.success) clean[key] = value.trim();
    }
  }
  return auditFiltersSchema.parse(clean);
}

/** [start, endExclusive) in UTC for an inclusive YYYY-MM-DD range. */
export function dateRange(from?: string, to?: string) {
  const start = from ? new Date(`${from}T00:00:00Z`) : undefined;
  const end = to ? new Date(Date.parse(`${to}T00:00:00Z`) + 24 * 60 * 60 * 1000) : undefined;
  return { start, end };
}
