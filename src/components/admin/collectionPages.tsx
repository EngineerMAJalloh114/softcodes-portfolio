import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth/guard";
import { getItemForEdit, listCollection } from "@/lib/content/admin";
import { COLLECTION_DEFS, type CollectionKey } from "@/lib/content/defs";
import { emptyObject } from "@/lib/content/fields";
import { previewsFor } from "@/lib/content/media";
import { CollectionList } from "./CollectionList";
import { ContentEditor } from "./ContentEditor";
import { Card, PageHeader } from "./ui";

/** List page for a collection (services, stack, projects). */
export async function CollectionIndex({ collection }: { collection: CollectionKey }) {
  await requirePermission("content.write");
  const def = COLLECTION_DEFS[collection];
  const rows = await listCollection(collection);
  return (
    <>
      <PageHeader
        title={def.label}
        intro={`${def.description} Only published items appear on the site; the order here is the order on the site.`}
        actions={
          <Link
            href={`${def.adminPath}/new`}
            className="inline-flex h-11 items-center rounded-full bg-btn-bg px-5 text-sm font-semibold text-btn-fg hover:bg-btn-bg/85"
          >
            + New {def.singular}
          </Link>
        }
      />
      <Card>
        <CollectionList collection={collection} rows={rows} adminBase={def.adminPath} singular={def.singular} />
      </Card>
    </>
  );
}

/** Editor page for one item, or a blank form for `id === "new"`. */
export async function CollectionItem({ collection, id }: { collection: CollectionKey; id: string }) {
  await requirePermission("content.write");
  const def = COLLECTION_DEFS[collection];
  const previewOf = (v: Record<string, unknown>) =>
    collection === "projects" ? `/projects/${String(v.slug ?? "")}` : def.path.split("#")[0] || "/";

  if (id === "new") {
    const initial = emptyObject(def.fields);
    if (collection === "projects") Object.assign(initial, { status: "Concept", type: "website" });
    return (
      <ContentEditor
        target={{ type: "item", collection, id: null, adminBase: def.adminPath }}
        title={`New ${def.singular}`}
        description="New items start as drafts unless you choose “Create and publish”."
        fields={def.fields}
        initial={initial}
        published={false}
        hasDraft={false}
        previewPath={null}
        backHref={def.adminPath}
        previews={{}}
      />
    );
  }

  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();
  const item = await getItemForEdit(collection, numericId);
  if (!item) notFound();
  return (
    <ContentEditor
      key={`${collection}-${item.id}-${item.hasDraft}-${item.published}`}
      target={{ type: "item", collection, id: item.id, adminBase: def.adminPath }}
      title={String(item.value[def.titleField] ?? def.singular)}
      description={def.description}
      fields={def.fields}
      initial={item.value}
      published={item.published}
      hasDraft={item.hasDraft}
      previewPath={previewOf(item.value)}
      backHref={def.adminPath}
      previews={await previewsFor(item.value)}
    />
  );
}
