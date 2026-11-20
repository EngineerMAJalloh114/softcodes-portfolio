import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { livePosts } from "@/lib/blog/posts";
import { getPublishedContent } from "@/lib/content/load";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { projects, posts } = await getPublishedContent();
  const routes = ["", "/about", "/projects", "/pricing", "/faq", "/blog", "/soft-codes", "/contact"].map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  const projectRoutes = projects.map((p) => ({
    url: `${site.url}/projects/${p.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  // Published, dated today or earlier (drafts and scheduled posts are never listed).
  const postRoutes = livePosts(posts).map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));
  return [...routes, ...projectRoutes, ...postRoutes];
}
