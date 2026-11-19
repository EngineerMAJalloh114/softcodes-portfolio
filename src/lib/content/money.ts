/** Price formatting for 'from' prices (DEC-25). Pure module. */
export type Currency = "USD" | "SLE";

export function formatPrice(minor: number, currency: Currency): string {
  const major = minor / 100;
  const n = major.toLocaleString("en-US", { minimumFractionDigits: minor % 100 ? 2 : 0, maximumFractionDigits: 2 });
  return currency === "USD" ? `$${n}` : `Le ${n}`;
}
