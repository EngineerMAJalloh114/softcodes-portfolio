import Link from "next/link";
import type { ReactNode } from "react";
import { getSiteContent } from "@/lib/content/load";
import { Footer } from "./Footer";
import { Nav } from "./Nav";
import { WhatsAppButton } from "./WhatsAppButton";

/** Public-site chrome: nav, main landmark (skip-link target), footer. Content from the DB. */
export async function SiteChrome({ children }: { children: ReactNode }) {
  const c = await getSiteContent();
  return (
    <>
      {c.preview && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-0 z-[60] flex flex-wrap items-center justify-center gap-3 bg-btn-bg px-4 py-3 text-sm font-semibold text-btn-fg"
        >
          Previewing drafts — unpublished changes are visible only to you.
          <Link prefetch={false} href="/api/preview/exit" className="underline underline-offset-4">
            Exit preview
          </Link>
        </div>
      )}
      <Nav nav={c.nav} contact={c.contact} site={c.site} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer contact={c.contact} footer={c.footer} />
      {c.features.whatsappButton && <WhatsAppButton href={c.contact.whatsappHireUrl} raised={c.preview} />}
    </>
  );
}
