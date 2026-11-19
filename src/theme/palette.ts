/**
 * Theme palette for places that cannot read CSS variables
 * (web manifest, <meta name="theme-color">, next/og image).
 * Keep in sync with the CSS variables in src/app/globals.css.
 */
export const palette = {
  dark: {
    bg: "#1A1A1A", // Jet Black
    surface: "#222526",
    border: "#353A3E",
    muted: "#BFBFBF",
    text: "#E0E0E0",
  },
  light: {
    bg: "#E0E0E0",
    surface: "#FFFFFF",
    border: "#BFBFBF",
    muted: "#353A3E",
    text: "#1A1A1A",
  },
} as const;

export type Theme = keyof typeof palette;

export const THEME_STORAGE_KEY = "theme";

/**
 * Runs inline in <head> before first paint: applies the saved theme,
 * otherwise the system preference. Also flags JS for scroll-reveal styles, and applies the
 * visitor's pricing currency (USD/SLE, remembered in localStorage) so prices don't flash.
 */
export const themeInitScript = `(function(){var d=document.documentElement;try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');d.dataset.theme=(s==='light'||s==='dark')?s:(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');}catch(e){}d.classList.add('js');try{var c=localStorage.getItem('currency');if(c==='USD'||c==='SLE')d.dataset.currency=c;}catch(e){}})();`;
