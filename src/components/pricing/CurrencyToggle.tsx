"use client";

import { useSyncExternalStore } from "react";

export type Currency = "USD" | "SLE";

const STORAGE_KEY = "currency";

function readCurrency(): Currency {
  return document.documentElement.dataset.currency === "SLE" ? "SLE" : "USD";
}

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-currency"] });
  return () => observer.disconnect();
}

/** Applies the choice site-wide (<html data-currency>) and remembers it for this visitor. */
export function applyCurrency(next: Currency) {
  document.documentElement.dataset.currency = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* storage unavailable: applies to this page view only */
  }
}

/** The visitor's currency (DEC-25), shared by the pricing toggle and the quote form. */
export function useCurrency(): Currency {
  return useSyncExternalStore(subscribe, readCurrency, () => "USD" as Currency);
}

/** USD / SLE switch (DEC-25). The head script applies the saved choice before paint. */
export function CurrencyToggle({ label }: { label: string }) {
  const currency = useCurrency();

  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap items-center gap-3">
      <span className="text-sm font-semibold text-muted">{label}</span>
      <div className="inline-flex rounded-full border border-border p-1">
        {(["USD", "SLE"] as const).map((c) => (
          <button
            key={c}
            type="button"
            data-currency-option={c}
            aria-pressed={currency === c}
            onClick={() => applyCurrency(c)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              currency === c ? "bg-btn-bg text-btn-fg" : "text-text hover:bg-surface"
            }`}
          >
            {c === "USD" ? "USD $" : "SLE Le"}
          </button>
        ))}
      </div>
    </div>
  );
}
