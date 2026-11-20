import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { getSettings } from "@/lib/admin/settings";
import { listMedia } from "@/lib/content/media";
import { requirePermission } from "@/lib/auth/guard";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Settings" };

/** G-20 Settings — owner only. Saves are validated (K-15) and audited (K-16). */
export default async function SettingsPage() {
  await requirePermission("settings.view");
  const [settings, media] = await Promise.all([getSettings(), listMedia({ visibility: "public" })]);
  const cvOptions = media.filter((m) => m.mime === "application/pdf").map((m) => ({ id: m.id, filename: m.filename }));
  return (
    <>
      <PageHeader
        title="Settings"
        intro="Business details used across the site. Every save is recorded in the audit log."
      />
      <SettingsForm initial={settings} cvOptions={cvOptions} />
    </>
  );
}
