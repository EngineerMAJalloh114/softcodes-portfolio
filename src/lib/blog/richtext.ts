/**
 * Blog rich text (DEC-42): ProseMirror/Tiptap JSON, sanitised by allowlist. Pure module.
 *
 * Only the node types, marks and attributes listed here survive — anything else (script,
 * iframe, style, event handlers such as onerror, unknown attrs) is dropped, and links/images
 * are checked. The same function runs when a post is saved (K-15) and again before it is
 * rendered, so stored data can never reach the page unchecked.
 */

/** Same as MEDIA_REF_RE in src/lib/content/fields.ts (kept here to avoid an import cycle). */
const MEDIA_REF_RE = /^media:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

export type Mark = { type: "bold" | "italic" | "underline" | "strike" | "code" } | { type: "link"; attrs: { href: string } };
export type InlineNode = { type: "text"; text: string; marks?: Mark[] } | { type: "hardBreak" };
export type BlockNode =
  | { type: "paragraph"; content?: InlineNode[] }
  | { type: "heading"; attrs: { level: 2 | 3 | 4 }; content?: InlineNode[] }
  | { type: "blockquote"; content: BlockNode[] }
  | { type: "bulletList"; content: ListItem[] }
  | { type: "orderedList"; attrs: { start: number }; content: ListItem[] }
  | { type: "codeBlock"; attrs: { language: string | null }; content?: { type: "text"; text: string }[] }
  | { type: "horizontalRule" }
  | { type: "image"; attrs: { ref: string; src: string; alt: string } };
export type ListItem = { type: "listItem"; content: BlockNode[] };
export type RichDoc = { type: "doc"; content: BlockNode[] };

export const EMPTY_DOC: RichDoc = { type: "doc", content: [{ type: "paragraph" }] };

const MAX_NODES = 20_000;
const MAX_DEPTH = 12;
const MAX_TEXT = 20_000;

/** Links allowed in posts: https/http, mailto, site paths and in-page anchors. */
export const SAFE_HREF_RE = /^(https?:\/\/[^\s<>"']+|mailto:[^\s@<>"']+@[^\s@<>"']+|\/(?!\/)[^\s<>"']*|#[\w-]*)$/i;
export function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  // Control characters and whitespace can hide a scheme ("java\tscript:"); refuse them outright.
  if (/[\u0000-\u001f\u007f\s]/.test(href)) return null;
  const v = href.trim();
  return v.length <= 2000 && SAFE_HREF_RE.test(v) ? v : null;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const SIMPLE_MARKS = new Set(["bold", "italic", "underline", "strike", "code"]);
const MEDIA_SRC_RE = /^https:\/\/[^\s<>"']+$/;

type Budget = { nodes: number };

function cleanMarks(raw: unknown): Mark[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: Mark[] = [];
  for (const m of raw) {
    if (!isObj(m) || typeof m.type !== "string") continue;
    if (SIMPLE_MARKS.has(m.type)) out.push({ type: m.type as "bold" });
    else if (m.type === "link") {
      const href = safeHref(isObj(m.attrs) ? m.attrs.href : null);
      if (href) out.push({ type: "link", attrs: { href } }); // javascript:, data:, vbscript: … → mark dropped, text kept
    }
  }
  return out.length ? out : undefined;
}

function cleanInline(raw: unknown, b: Budget): InlineNode[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: InlineNode[] = [];
  for (const n of raw) {
    if (!isObj(n) || ++b.nodes > MAX_NODES) continue;
    if (n.type === "text" && typeof n.text === "string" && n.text.length) {
      const marks = cleanMarks(n.marks);
      out.push({ type: "text", text: n.text.slice(0, MAX_TEXT), ...(marks ? { marks } : {}) });
    } else if (n.type === "hardBreak") out.push({ type: "hardBreak" });
  }
  return out.length ? out : undefined;
}

function cleanBlocks(raw: unknown, b: Budget, depth: number): BlockNode[] {
  if (!Array.isArray(raw) || depth > MAX_DEPTH) return [];
  const out: BlockNode[] = [];
  for (const n of raw) {
    if (!isObj(n) || ++b.nodes > MAX_NODES) continue;
    const attrs = isObj(n.attrs) ? n.attrs : {};
    switch (n.type) {
      case "paragraph": {
        const content = cleanInline(n.content, b);
        out.push(content ? { type: "paragraph", content } : { type: "paragraph" });
        break;
      }
      case "heading": {
        // h1 is the post title; body headings are h2–h4.
        const level = Math.min(4, Math.max(2, Number(attrs.level) || 2)) as 2 | 3 | 4;
        const content = cleanInline(n.content, b);
        out.push({ type: "heading", attrs: { level }, ...(content ? { content } : {}) });
        break;
      }
      case "blockquote": {
        const content = cleanBlocks(n.content, b, depth + 1);
        if (content.length) out.push({ type: "blockquote", content });
        break;
      }
      case "bulletList":
      case "orderedList": {
        const items: ListItem[] = [];
        for (const li of Array.isArray(n.content) ? n.content : []) {
          if (!isObj(li) || li.type !== "listItem" || ++b.nodes > MAX_NODES) continue;
          const content = cleanBlocks(li.content, b, depth + 1);
          if (content.length) items.push({ type: "listItem", content });
        }
        if (!items.length) break;
        if (n.type === "bulletList") out.push({ type: "bulletList", content: items });
        else {
          const start = Math.min(10_000, Math.max(1, Math.floor(Number(attrs.start) || 1)));
          out.push({ type: "orderedList", attrs: { start }, content: items });
        }
        break;
      }
      case "codeBlock": {
        const language = typeof attrs.language === "string" && /^[a-z0-9+#-]{1,20}$/i.test(attrs.language) ? attrs.language : null;
        const text = (Array.isArray(n.content) ? n.content : [])
          .map((t) => (isObj(t) && t.type === "text" && typeof t.text === "string" ? t.text : ""))
          .join("")
          .slice(0, MAX_TEXT);
        out.push({ type: "codeBlock", attrs: { language }, ...(text ? { content: [{ type: "text", text }] } : {}) });
        break;
      }
      case "horizontalRule":
        out.push({ type: "horizontalRule" });
        break;
      case "image": {
        // Images must come from the media library (DEC-42): the ref is resolved again at render.
        const ref = typeof attrs.ref === "string" && MEDIA_REF_RE.test(attrs.ref) ? attrs.ref : null;
        if (!ref) break;
        const src = typeof attrs.src === "string" && MEDIA_SRC_RE.test(attrs.src) ? attrs.src : "";
        const alt = typeof attrs.alt === "string" ? attrs.alt.slice(0, 300) : "";
        out.push({ type: "image", attrs: { ref, src, alt } });
        break;
      }
      default:
        // Unknown or dangerous node (script, iframe, html, …): dropped with its content.
        break;
    }
  }
  return out;
}

/** Allowlist sanitiser. Always returns a valid document (never throws). */
export function sanitizeDoc(input: unknown): RichDoc {
  let value = input;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return EMPTY_DOC;
    }
  }
  if (!isObj(value) || value.type !== "doc") return EMPTY_DOC;
  const content = cleanBlocks(value.content, { nodes: 0 }, 0);
  return { type: "doc", content: content.length ? content : EMPTY_DOC.content };
}

/* ------------------------------------------------------------------ */
/* Derived values                                                      */
/* ------------------------------------------------------------------ */

function textOf(nodes: readonly unknown[] | undefined, out: string[]) {
  for (const n of nodes ?? []) {
    if (!isObj(n)) continue;
    if (n.type === "text" && typeof n.text === "string") out.push(n.text);
    else if (n.type === "image" && isObj(n.attrs) && typeof n.attrs.alt === "string") out.push(n.attrs.alt);
    if (Array.isArray(n.content)) {
      textOf(n.content, out);
      out.push("\n");
    }
  }
  return out;
}

/** Plain text of a document (search, excerpts, reading time). */
export function plainText(doc: RichDoc): string {
  return textOf(doc.content, []).join("").replace(/\n{2,}/g, "\n").trim();
}

export function wordCount(doc: RichDoc): number {
  const t = plainText(doc);
  return t ? t.split(/\s+/).length : 0;
}

/** Reading time in minutes at 200 words per minute, at least 1. */
export function readingMinutes(doc: RichDoc): number {
  return Math.max(1, Math.round(wordCount(doc) / 200));
}

/** Media ids used by images in a document (to resolve their URLs and track usage). */
export function imageRefs(doc: RichDoc): string[] {
  const out: string[] = [];
  const walk = (nodes: readonly unknown[] | undefined) => {
    for (const n of nodes ?? []) {
      if (!isObj(n)) continue;
      if (n.type === "image" && isObj(n.attrs) && typeof n.attrs.ref === "string") out.push(n.attrs.ref);
      if (Array.isArray(n.content)) walk(n.content);
    }
  };
  walk(doc.content);
  return out;
}

export function isEmptyDoc(doc: RichDoc): boolean {
  return wordCount(doc) === 0 && imageRefs(doc).length === 0;
}

/** Replace image srcs from their media refs; images whose ref doesn't resolve are removed. */
export function resolveDocImages(doc: RichDoc, resolve: (ref: string) => string | null): RichDoc {
  const walk = (nodes: BlockNode[]): BlockNode[] =>
    nodes.flatMap((n): BlockNode[] => {
      if (n.type === "image") {
        const src = resolve(n.attrs.ref);
        return src ? [{ ...n, attrs: { ...n.attrs, src } }] : [];
      }
      if (n.type === "blockquote") return [{ ...n, content: walk(n.content) }];
      if (n.type === "bulletList" || n.type === "orderedList")
        return [{ ...n, content: n.content.map((li) => ({ ...li, content: walk(li.content) })) }] as BlockNode[];
      return [n];
    });
  return { type: "doc", content: walk(doc.content) };
}
