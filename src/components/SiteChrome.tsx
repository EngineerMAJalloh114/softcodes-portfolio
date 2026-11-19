import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Nav } from "./Nav";

/** Public-site chrome: nav, main landmark (skip-link target), footer. */
export function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
