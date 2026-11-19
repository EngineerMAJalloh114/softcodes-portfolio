import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_NAV,
  PERMISSIONS,
  ROLES,
  assertCan,
  can,
  permissionForPath,
  permissionsFor,
  type Permission,
  type Role,
} from "../src/lib/auth/permissions";

/**
 * Expected access, written out independently of the matrix in permissions.ts so a change
 * to the matrix has to be made (and reviewed) in two places.
 */
const EXPECTED: Record<Role, Permission[]> = {
  owner: [...PERMISSIONS],
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
  client: [],
};

describe("RBAC matrix (G-03, K-05)", () => {
  for (const role of ROLES) {
    for (const permission of PERMISSIONS) {
      const expected = EXPECTED[role].includes(permission);
      it(`${role} ${expected ? "can" : "cannot"} ${permission}`, () => {
        assert.equal(can(role, permission), expected);
      });
    }
  }

  it("owner-only permissions are exactly settings.view and settings.write", () => {
    const ownerOnly = PERMISSIONS.filter((p) => can("owner", p) && !ROLES.some((r) => r !== "owner" && can(r, p)));
    assert.deepEqual(ownerOnly, ["settings.view", "settings.write"]);
  });

  it("staff and client cannot reach owner-only or audit routes", () => {
    for (const role of ["staff", "client"] as const) {
      for (const path of ["/admin/settings", "/admin/audit"]) {
        assert.equal(can(role, permissionForPath(path)!), false, `${role} ${path}`);
      }
    }
  });

  it("client has no admin access at all", () => {
    assert.deepEqual(permissionsFor("client"), []);
    for (const item of ADMIN_NAV) assert.equal(can("client", item.permission), false);
  });

  it("denies by default: unknown roles and junk input get nothing", () => {
    for (const bogus of [undefined, null, "", "superuser", "OWNER", 1, {}]) {
      for (const p of PERMISSIONS) assert.equal(can(bogus, p), false);
      assert.deepEqual(permissionsFor(bogus), []);
    }
  });

  it("every admin nav item maps to a permission; unknown admin paths map to none", () => {
    for (const item of ADMIN_NAV) assert.equal(permissionForPath(item.href), item.permission);
    assert.equal(permissionForPath("/admin/settings/"), "settings.view");
    assert.equal(permissionForPath("/admin/audit/123"), "audit.view");
    assert.equal(permissionForPath("/admin/unknown"), null);
  });

  it("assertCan throws ForbiddenError when denied", () => {
    assert.throws(() => assertCan("admin", "settings.write"), { name: "ForbiddenError" });
    assert.doesNotThrow(() => assertCan("owner", "settings.write"));
  });
});
