"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ThemeImage } from "@/components/ThemeImage";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CloseIcon, MenuIcon } from "@/components/Icons";
import { authClient } from "@/lib/auth/client";

export type ShellNavItem = { href: string; label: string; release: string | null };

/** Admin chrome: sidebar (drawer below lg) + top bar. Navigation is pre-filtered server-side. */
export function AdminShell({
  user,
  nav,
  children,
}: {
  user: { email: string; role: string };
  nav: ShellNavItem[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Close the drawer on navigation and on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function signOut(everywhere: boolean) {
    setBusy(true);
    if (everywhere) await authClient.revokeSessions();
    await authClient.signOut();
    router.replace("/auth/sign-in");
    router.refresh();
  }

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const sidebar = (
    <nav aria-label="Admin" className="flex flex-col">
      <ul className="space-y-1">
        {nav.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors duration-200 ${
                  active ? "bg-bg text-text" : "text-muted hover:bg-bg/60 hover:text-text"
                }`}
              >
                <span>{item.label}</span>
                {item.release && (
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {item.release}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-6 space-y-1 border-t border-border pt-4 text-sm">
        <Link href="/auth/change-password" className="block rounded-xl px-3 py-2 font-semibold text-muted hover:bg-bg/60 hover:text-text">
          Change password
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={() => signOut(true)}
          className="block w-full rounded-xl px-3 py-2 text-left font-semibold text-muted hover:bg-bg/60 hover:text-text disabled:opacity-60"
        >
          Sign out everywhere
        </button>
      </div>
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-btn-bg focus:px-4 focus:py-2 focus:text-btn-fg"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-xl">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-text lg:hidden"
            aria-expanded={open}
            aria-controls="admin-sidebar"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
          <Link href="/admin" className="flex items-center gap-2" aria-label="Soft CODES admin — dashboard">
            <ThemeImage name="softcodes-icon" alt="" width={977} height={977} className="block h-8 w-8" />
            <span className="whitespace-nowrap text-base font-extrabold tracking-tight text-text">
              <span className="hidden sm:inline">Soft CODES </span>
              <span className="font-semibold text-muted sm:font-semibold">Admin</span>
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-[16rem] truncate text-sm font-semibold text-text">{user.email}</p>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{user.role}</p>
            </div>
            <ThemeToggle />
            <button
              type="button"
              disabled={busy}
              onClick={() => signOut(false)}
              className="inline-flex h-10 items-center whitespace-nowrap rounded-full bg-btn-bg px-4 text-sm font-semibold text-btn-fg transition duration-300 hover:bg-btn-bg/85 disabled:opacity-60"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-border bg-surface p-4 lg:block">
          <div className="sticky top-20">{sidebar}</div>
        </aside>

        {/* Mobile drawer */}
        <div
          id="admin-sidebar"
          hidden={!open}
          className="fixed inset-0 top-16 z-30 lg:hidden"
        >
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-bg/70" />
          <aside className="relative h-full w-72 max-w-[85vw] overflow-y-auto border-r border-border bg-surface p-4">
            <p className="mb-4 truncate px-3 text-sm text-muted sm:hidden">
              {user.email} · <span className="uppercase">{user.role}</span>
            </p>
            {sidebar}
          </aside>
        </div>

        <main id="admin-main" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
