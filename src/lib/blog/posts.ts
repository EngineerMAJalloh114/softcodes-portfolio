/**
 * Blog helpers (M-05): which posts are live, ordering, pagination, related posts, RSS and
 * Article structured data. Pure module — unit-tested.
 */
import type { BlogPost } from "@/lib/content/types";

export const POSTS_PER_PAGE = 9;

const today = (now: Date) => now.toISOString().slice(0, 10);

/**
 * Posts visitors may see: published and dated today or earlier (future-dated posts appear
 * on their day). In admin preview, drafts and future posts are shown too.
 * Order: featured first, then newest.
 */
export function livePosts(posts: BlogPost[], opts: { now?: Date; preview?: boolean } = {}): BlogPost[] {
  const day = today(opts.now ?? new Date());
  return posts
    .filter((p) => opts.preview || (!p.isDraft && !!p.publishedAt && p.publishedAt <= day))
    .sort(
      (a, b) =>
        Number(b.featured) - Number(a.featured) ||
        (b.publishedAt ?? "9999").localeCompare(a.publishedAt ?? "9999") ||
        a.slug.localeCompare(b.slug),
    );
}

/** Newest first, ignoring "featured" (RSS, sitemap). */
export function byDate(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? "") || a.slug.localeCompare(b.slug));
}

export function paginate<T>(items: T[], page: number, perPage = POSTS_PER_PAGE) {
  const pages = Math.max(1, Math.ceil(items.length / perPage));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  return { items: items.slice((current - 1) * perPage, current * perPage), page: current, pages };
}

/** Up to `n` related posts: same category first, then shared tags, then newest. */
export function relatedPosts(post: BlogPost, all: BlogPost[], n = 3): BlogPost[] {
  const score = (p: BlogPost) =>
    (post.category && p.category === post.category ? 10 : 0) + p.tags.filter((t) => post.tags.includes(t)).length;
  return byDate(all.filter((p) => p.slug !== post.slug))
    .map((p, i) => ({ p, s: score(p), i }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map((x) => x.p);
}

/** Lenient query parsing for /blog?category=…&page=… */
export function parseBlogQuery(params: Record<string, string | string[] | undefined>, categories: string[]) {
  const one = (k: string) => {
    const v = params[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
  };
  const category = categories.includes(one("category")) ? one("category") : null;
  const page = Math.max(1, Math.floor(Number(one("page"))) || 1);
  return { category, page };
}

export function blogHref(q: { category: string | null; page: number }) {
  const sp = new URLSearchParams();
  if (q.category) sp.set("category", q.category);
  if (q.page > 1) sp.set("page", String(q.page));
  const s = sp.toString();
  return `/blog${s ? `?${s}` : ""}`;
}

export function formatPostDate(day: string | null): string {
  if (!day) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
}

/* ------------------------------------------------------------------ */
/* RSS 2.0                                                             */
/* ------------------------------------------------------------------ */

export function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
}

export function rssFeed(opts: { siteUrl: string; title: string; description: string; posts: BlogPost[]; categoryName: (slug: string | null) => string | null }): string {
  const base = opts.siteUrl.replace(/\/+$/, "");
  const items = byDate(opts.posts)
    .slice(0, 50)
    .map((p) => {
      const url = `${base}/blog/${p.slug}`;
      const cat = opts.categoryName(p.category);
      return [
        "    <item>",
        `      <title>${xmlEscape(p.title)}</title>`,
        `      <link>${xmlEscape(url)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
        `      <pubDate>${new Date(`${p.publishedAt}T00:00:00Z`).toUTCString()}</pubDate>`,
        `      <description>${xmlEscape(p.excerpt)}</description>`,
        ...(cat ? [`      <category>${xmlEscape(cat)}</category>`] : []),
        "    </item>",
      ].join("\n");
    });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${xmlEscape(opts.title)}</title>`,
    `    <link>${xmlEscape(`${base}/blog`)}</link>`,
    `    <description>${xmlEscape(opts.description)}</description>`,
    "    <language>en</language>",
    `    <atom:link href="${xmlEscape(`${base}/blog/rss.xml`)}" rel="self" type="application/rss+xml"/>`,
    ...items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* Article structured data                                             */
/* ------------------------------------------------------------------ */

export function articleJsonLd(p: BlogPost, opts: { siteUrl: string; author: string; publisher: string; logo: string }) {
  const url = `${opts.siteUrl.replace(/\/+$/, "")}/blog/${p.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.seoDescription || p.excerpt,
    url,
    mainEntityOfPage: url,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt,
    ...(p.coverImage ? { image: [p.coverImage] } : {}),
    author: { "@type": "Person", name: opts.author },
    publisher: { "@type": "Organization", name: opts.publisher, logo: { "@type": "ImageObject", url: opts.logo } },
    ...(p.tags.length ? { keywords: p.tags.join(", ") } : {}),
  };
}
