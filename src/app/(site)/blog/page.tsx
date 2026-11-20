import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/admin/ui";
import { PostCard } from "@/components/blog/PostCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Reveal } from "@/components/Reveal";
import { Container, Eyebrow } from "@/components/Section";
import { blogHref, livePosts, paginate, parseBlogQuery } from "@/lib/blog/posts";
import { getSiteContent } from "@/lib/content/load";

export async function generateMetadata({ searchParams }: PageProps<"/blog">): Promise<Metadata> {
  const c = await getSiteContent();
  const q = parseBlogQuery(await searchParams, c.postCategories.map((x) => x.slug));
  const cat = c.postCategories.find((x) => x.slug === q.category);
  const title = cat ? `${cat.name} · ${c.pages.blog.title}` : c.pages.blog.title;
  return {
    title,
    description: cat?.description || c.pages.blog.description,
    alternates: { canonical: blogHref(q), types: { "application/rss+xml": "/blog/rss.xml" } },
    openGraph: { title, description: c.pages.blog.description, url: blogHref(q) },
  };
}

/** M-05 blog index: newest first (featured pinned), filter by category, 9 per page. */
export default async function BlogPage({ searchParams }: PageProps<"/blog">) {
  const c = await getSiteContent();
  const { blog } = c;
  const all = livePosts(c.posts, { preview: c.preview });
  const used = new Set(all.map((p) => p.category));
  const categories = c.postCategories.filter((x) => used.has(x.slug));
  const q = parseBlogQuery(await searchParams, categories.map((x) => x.slug));
  const filtered = q.category ? all.filter((p) => p.category === q.category) : all;
  const { items, page, pages } = paginate(filtered, q.page);
  const nameOf = (slug: string | null) => c.postCategories.find((x) => x.slug === slug)?.name ?? null;
  const chip = (active: boolean) =>
    `inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
      active ? "border-text bg-btn-bg text-btn-fg" : "border-border text-muted hover:text-text"
    }`;

  return (
    <section className="pt-36 pb-24 sm:pt-44 sm:pb-32">
      <Container>
        <Reveal className="max-w-2xl">
          <Eyebrow>{blog.eyebrow}</Eyebrow>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-text sm:text-6xl">{blog.heading}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{blog.intro}</p>
        </Reveal>

        {categories.length > 0 && (
          <nav aria-label="Categories" className="mt-10 flex flex-wrap gap-2">
            <Link href="/blog" className={chip(!q.category)} aria-current={!q.category ? "page" : undefined}>
              {blog.allCategoriesLabel}
            </Link>
            {categories.map((x) => (
              <Link
                key={x.slug}
                href={blogHref({ category: x.slug, page: 1 })}
                className={chip(q.category === x.slug)}
                aria-current={q.category === x.slug ? "page" : undefined}
                data-category={x.slug}
              >
                {x.name}
              </Link>
            ))}
          </nav>
        )}

        {items.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-border bg-surface" data-blog-empty>
            <EmptyState title={blog.emptyHeading} body={blog.emptyBody} />
          </div>
        ) : (
          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p, i) => (
              <li key={p.slug}>
                <PostCard post={p} categoryName={nameOf(p.category)} readingLabel={blog.readingTimeLabel} priority={i < 3} />
              </li>
            ))}
          </ul>
        )}

        {pages > 1 && (
          <nav aria-label="Pagination" className="mt-12 flex items-center justify-between gap-4 text-sm font-semibold">
            {page > 1 ? (
              <Link href={blogHref({ category: q.category, page: page - 1 })} rel="prev" className="text-text hover:underline">
                ← Newer posts
              </Link>
            ) : (
              <span />
            )}
            <span className="text-muted">
              Page {page} of {pages}
            </span>
            {page < pages ? (
              <Link href={blogHref({ category: q.category, page: page + 1 })} rel="next" className="text-text hover:underline">
                Older posts →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}

        <div className="mt-16 max-w-2xl">
          <NewsletterForm newsletter={c.newsletter} source="blog" />
        </div>

        <p className="mt-12 text-sm">
          <a href="/blog/rss.xml" className="font-semibold text-muted hover:text-text">
            {blog.rssLabel}
          </a>
        </p>
      </Container>
    </section>
  );
}
