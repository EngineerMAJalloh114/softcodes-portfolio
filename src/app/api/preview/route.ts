import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/auth/guard";
import { safePath } from "@/lib/content/paths";

/**
 * "Preview draft": enable Next.js Draft Mode for signed-in content editors, then show the
 * page with unpublished changes. Everyone else is refused (403).
 */
export async function GET(request: Request) {
  const ctx = await checkPermission("content.write");
  if (!ctx) return new Response("Forbidden", { status: 403 });
  (await draftMode()).enable();
  redirect(safePath(new URL(request.url).searchParams.get("path")));
}
