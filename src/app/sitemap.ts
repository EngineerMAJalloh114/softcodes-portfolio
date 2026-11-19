import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { getPublishedContent } from "@/lib/content/load";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { projects } = await getPublishedContent();
  const routes = ["", "/projects", "/soft-codes", "/contact"].map((path) => ({
    url: `${site.url}${path}`,
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));
  const projectRoutes = projects.map((p) => ({
    url: `${site.url}/projects/${p.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
  return [...routes, ...projectRoutes];
}
