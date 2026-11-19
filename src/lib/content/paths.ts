/** A same-site path for redirects (no //host, no scheme, no backslashes); "/" otherwise. Pure. */
export function safePath(value: string | null | undefined): string {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : "/";
}
