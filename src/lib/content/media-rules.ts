/**
 * Media library rules (M-09): allowed types, size limits, content sniffing and object keys.
 * Pure module — shared by the upload action, the admin UI and the tests.
 *
 * The browser-declared type is never trusted: the file's first bytes must match an allowed
 * signature. SVG is not accepted (it can carry scripts).
 */

export const MEDIA_TYPES = {
  "image/jpeg": { ext: "jpg", kind: "image", maxBytes: 5 * 1024 * 1024 },
  "image/png": { ext: "png", kind: "image", maxBytes: 5 * 1024 * 1024 },
  "image/webp": { ext: "webp", kind: "image", maxBytes: 5 * 1024 * 1024 },
  "image/gif": { ext: "gif", kind: "image", maxBytes: 5 * 1024 * 1024 },
  "image/avif": { ext: "avif", kind: "image", maxBytes: 5 * 1024 * 1024 },
  "application/pdf": { ext: "pdf", kind: "document", maxBytes: 15 * 1024 * 1024 },
} as const;
export type MediaMime = keyof typeof MEDIA_TYPES;
export const ACCEPT_ATTR = Object.keys(MEDIA_TYPES).join(",");
export const MAX_UPLOAD_BYTES = Math.max(...Object.values(MEDIA_TYPES).map((t) => t.maxBytes));

const startsWith = (b: Uint8Array, sig: number[], offset = 0) => sig.every((v, i) => b[offset + i] === v);
const ascii = (b: Uint8Array, from: number, to: number) => String.fromCharCode(...b.slice(from, to));

/** Detect the real type from the file's first bytes. Returns null if not an allowed type. */
export function sniffMime(bytes: Uint8Array): MediaMime | null {
  if (bytes.length < 12) return null;
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (ascii(bytes, 0, 6) === "GIF87a" || ascii(bytes, 0, 6) === "GIF89a") return "image/gif";
  if (ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  if (ascii(bytes, 4, 8) === "ftyp" && ["avif", "avis"].includes(ascii(bytes, 8, 12))) return "image/avif";
  if (ascii(bytes, 0, 5) === "%PDF-") return "application/pdf";
  return null;
}

export type UploadCheck =
  | { ok: true; mime: MediaMime; kind: "image" | "document"; ext: string }
  | { ok: false; error: string };

/** Validate an upload: real type allowed, declared type consistent, size within limit. */
export function checkUpload(bytes: Uint8Array, declaredType: string): UploadCheck {
  if (bytes.byteLength === 0) return { ok: false, error: "The file is empty." };
  const mime = sniffMime(bytes);
  if (!mime) return { ok: false, error: "Unsupported file. Upload a JPEG, PNG, WebP, GIF, AVIF image or a PDF." };
  const declared = declaredType.toLowerCase();
  if (declared && declared !== "application/octet-stream" && declared !== mime && !(declared === "image/jpg" && mime === "image/jpeg")) {
    return { ok: false, error: `The file's contents (${mime}) don't match its type (${declaredType}).` };
  }
  const rule = MEDIA_TYPES[mime];
  if (bytes.byteLength > rule.maxBytes) {
    return { ok: false, error: `Too large: ${rule.kind === "image" ? "images" : "PDFs"} can be at most ${rule.maxBytes / 1024 / 1024} MB.` };
  }
  return { ok: true, mime, kind: rule.kind, ext: rule.ext };
}

/** Safe, readable file name: lowercase letters, digits and hyphens. */
export function sanitizeFilename(name: string): string {
  const base = name.replace(/\.[^.]*$/, "");
  const clean = base
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return clean || "file";
}

/** Unique object key per upload, so cached copies never go stale (new key on replace). */
export function mediaKey(filename: string, ext: string, id: string, now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `media/${y}/${m}/${id.slice(0, 8)}-${Date.now().toString(36)}-${sanitizeFilename(filename)}.${ext}`;
}
