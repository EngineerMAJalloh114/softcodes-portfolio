import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/ui";
import { requirePermission } from "@/lib/auth/guard";
import { listMedia } from "@/lib/content/media";
import { MediaLibrary } from "./MediaLibrary";

export const metadata: Metadata = { title: "Media" };

/** M-09 media library: Neon object storage (DEC-32). */
export default async function MediaPage() {
  await requirePermission("media.manage");
  const items = await listMedia();
  return (
    <>
      <PageHeader
        title="Media"
        intro="Images for the site (public) and documents (private by default). Use an image in content with “Choose from library”. Images: JPEG, PNG, WebP, GIF, AVIF up to 5 MB. PDFs up to 15 MB."
      />
      <MediaLibrary items={JSON.parse(JSON.stringify(items))} />
    </>
  );
}
