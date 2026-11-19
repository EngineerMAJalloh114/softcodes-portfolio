import Link from "next/link";
import { EmptyState } from "@/components/admin/ui";

/** Rendered (HTTP 403) when forbidden() is called — a role without the needed permission. */
export default function Forbidden() {
  return (
    <section className="mx-auto max-w-lg px-6 py-24 text-center">
      <EmptyState
        title="You don't have access to this page"
        body="Your role doesn't include this section. Ask the owner if you need it."
      />
      <Link href="/" className="mt-6 inline-block font-semibold text-text underline underline-offset-4">
        Back to the site
      </Link>
    </section>
  );
}
