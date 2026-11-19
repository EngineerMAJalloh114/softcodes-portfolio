import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentEditor } from "@/components/admin/ContentEditor";
import { requirePermission } from "@/lib/auth/guard";
import { getSectionForEdit } from "@/lib/content/admin";
import { SECTION_DEFS, isSectionKey } from "@/lib/content/defs";
import { previewsFor } from "@/lib/content/media";

export const metadata: Metadata = { title: "Edit section" };

export default async function SectionPage({ params }: PageProps<"/admin/content/sections/[key]">) {
  await requirePermission("content.write");
  const { key } = await params;
  if (!isSectionKey(key)) notFound();
  const def = SECTION_DEFS[key];
  const section = await getSectionForEdit(key);
  return (
    <ContentEditor
      key={`${key}-${section.hasDraft}-${section.updatedAt?.toISOString() ?? ""}`}
      target={{ type: "section", key }}
      title={def.label}
      description={def.description}
      fields={def.fields}
      initial={section.value}
      published
      hasDraft={section.hasDraft}
      previewPath={def.path.split("#")[0] || "/"}
      backHref="/admin/content"
      previews={await previewsFor(section.value)}
    />
  );
}
