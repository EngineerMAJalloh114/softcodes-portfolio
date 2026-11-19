import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminAccess } from "@/lib/auth/guard";
import { ADMIN_NAV, can } from "@/lib/auth/permissions";
import { unreadNotificationCount } from "@/lib/leads/service";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Soft CODES" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  // Shell gate (signed in, admin-capable role, MFA). Each page also checks its own permission.
  const { user, role } = await requireAdminAccess();
  // Unread owner notifications (new leads) as a badge on Leads; emailed later via Resend (T7b).
  const unread = can(role, "leads.read") ? await unreadNotificationCount() : 0;
  const nav = ADMIN_NAV.filter((item) => can(role, item.permission)).map(({ href, label, release }) => ({
    href,
    label,
    release: release ? `Coming in ${release}` : null,
    badge: href === "/admin/leads" ? unread : undefined,
  }));
  return (
    <AdminShell user={{ email: user.email, role }} nav={nav}>
      {children}
    </AdminShell>
  );
}
