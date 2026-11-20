/** Pure helper shared by the public loader and the admin editor. */
const isPlain = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Stored values over seed values; nested plain objects are merged one level deep. */
export function mergeSeed(seedValue: unknown, stored: unknown): unknown {
  if (!isPlain(seedValue) || !isPlain(stored)) return stored ?? seedValue;
  const out: Record<string, unknown> = { ...seedValue, ...stored };
  for (const [k, v] of Object.entries(seedValue)) if (isPlain(v) && isPlain(stored[k])) out[k] = { ...v, ...stored[k] };
  return out;
}
