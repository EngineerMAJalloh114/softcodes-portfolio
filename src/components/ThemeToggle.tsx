"use client";

import { useEffect, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY, type Theme } from "@/theme/palette";
import { MoonIcon, SunIcon } from "./Icons";

const systemQuery = "(prefers-color-scheme: light)";

function readTheme(): Theme | null {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : null;
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}

function storedTheme(): Theme | null {
  try {
    const s = localStorage.getItem(THEME_STORAGE_KEY);
    return s === "light" || s === "dark" ? s : null;
  } catch {
    return null;
  }
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  // null on the server / before hydration, so markup matches.
  const theme = useSyncExternalStore(subscribe, readTheme, () => null);

  // Follow live system changes until the visitor makes an explicit choice.
  useEffect(() => {
    const mq = window.matchMedia(systemQuery);
    const onSystemChange = () => {
      if (!storedTheme()) document.documentElement.dataset.theme = mq.matches ? "light" : "dark";
    };
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  function toggle() {
    const next: Theme = readTheme() === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable: the choice lasts for this page view only */
    }
  }

  const label =
    theme === "light" ? "Switch to dark theme" : theme === "dark" ? "Switch to light theme" : "Toggle colour theme";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`inline-flex h-11 w-11 items-center justify-center rounded-full border border-border text-text transition-colors duration-300 hover:border-[var(--border-hover)] ${className}`}
    >
      {/* Dark theme shows the sun (go light); light theme shows the moon (go dark). */}
      <SunIcon className="theme-dark-only h-5 w-5" />
      <MoonIcon className="theme-light-only h-5 w-5" />
    </button>
  );
}
