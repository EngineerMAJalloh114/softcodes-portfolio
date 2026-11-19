import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getSettings } from "@/lib/admin/settings";
import { requirePermission } from "@/lib/auth/guard";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Settings" };

/** G-20 Settings — owner only. Saves are validated (K-15) and audited (K-16). */
export default async function SettingsPage() {
  await requirePermission("settings.view");
  const settings = await getSettings();
  return (
    <>
      <PageHeader
        title="Settings"
        intro="Business details used across the site. Every save is recorded in the audit log. The public site switches to these values in T5."
      />
      <SettingsForm initial={settings} />
    </>
  );
}
