import { livePosts, rssFeed } from "@/lib/blog/posts";
import { getPublishedContent } from "@/lib/content/load";

// Rebuilt when content is published (cache tag "content") and at least hourly.
export const revalidate = 3600;

/** M-05 RSS 2.0 feed of published posts (newest 50). Drafts and future-dated posts are never included. */
export async function GET() {
  const c = await getPublishedContent();
  const xml = rssFeed({
    siteUrl: c.site.url,
    title: `${c.pages.blog.title} · ${c.site.name}`,
    description: c.pages.blog.description,
    posts: livePosts(c.posts),
    categoryName: (slug) => c.postCategories.find((x) => x.slug === slug)?.name ?? null,
  });
  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8", "cache-control": "public, max-age=0, s-maxage=3600" },
  });
}
