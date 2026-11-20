import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { optimisable, PostCard, PostMeta } from "@/components/blog/PostCard";
import { RichText } from "@/components/blog/RichText";
import { NewsletterForm } from "@/components/NewsletterForm";
import { ArrowLeft } from "@/components/Icons";
import { Reveal } from "@/components/Reveal";
import { Container } from "@/components/Section";
import { articleJsonLd, livePosts, relatedPosts } from "@/lib/blog/posts";
import { jsonLdString } from "@/lib/content/faq-jsonld";
import { getPublishedContent, getSiteContent } from "@/lib/content/load";

// Published posts are prerendered; new ones render on first visit (then cached).
export const revalidate = 3600;

export async function generateStaticParams() {
  const c = await getPublishedContent();
  return livePosts(c.posts).map((p) => ({ slug: p.slug }));
}

async function findPost(slug: string) {
  const c = await getSiteContent();
  const posts = livePosts(c.posts, { preview: c.preview });
  return { c, posts, post: posts.find((p) => p.slug === slug) };
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { post } = await findPost(slug);
  if (!post) return {};
  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt;
  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/blog/${post.slug}`,
      ...(post.publishedAt ? { publishedTime: post.publishedAt } : {}),
      ...(post.tags.length ? { tags: post.tags } : {}),
      // Without a cover the site's default OG image (app/opengraph-image) is used.
      ...(post.coverImage ? { images: [{ url: post.coverImage, alt: post.title }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description, ...(post.coverImage ? { images: [post.coverImage] } : {}) },
  };
}

/** M-05 blog post: cover, reading time, sanitised rich text, related posts, Article data. */
export default async function PostPage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const { c, posts, post } = await findPost(slug);
  if (!post) notFound();
  const nameOf = (s: string | null) => c.postCategories.find((x) => x.slug === s)?.name ?? null;
  const related = relatedPosts(post, posts.filter((p) => !p.isDraft));
  const ld = articleJsonLd(post, {
    siteUrl: c.site.url,
    author: c.person.name,
    publisher: c.site.name,
    logo: `${c.site.url.replace(/\/+$/, "")}/brand/icon-512.png`,
  });

  return (
    <article className="pt-36 pb-24 sm:pt-44 sm:pb-32">
      {!post.isDraft && !c.preview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />}
      <Container className="max-w-3xl">
        <Reveal>
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-text">
            <ArrowLeft />
            {c.pages.blog.title}
          </Link>
        </Reveal>
        <Reveal delay={100} className="mt-10">
          <div className="flex flex-wrap items-center gap-3">
            <PostMeta post={post} categoryName={nameOf(post.category)} readingLabel={c.blog.readingTimeLabel} />
            {post.isDraft && <span className="rounded-full bg-btn-bg px-2.5 py-0.5 text-xs font-semibold text-btn-fg">Draft</span>}
          </div>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-text sm:text-5xl">{post.title}</h1>
          {post.excerpt && <p className="mt-5 text-xl leading-relaxed text-muted">{post.excerpt}</p>}
        </Reveal>
        {post.coverImage && (
          <Reveal delay={150} className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl border border-border">
            <Image src={post.coverImage} alt="" fill priority sizes="(min-width: 768px) 768px, 100vw" unoptimized={!optimisable(post.coverImage)} className="object-cover" />
          </Reveal>
        )}
        <div className="mt-12" data-post-body>
          <RichText doc={post.body} />
        </div>
        {post.tags.length > 0 && (
          <ul aria-label="Tags" className="mt-12 flex flex-wrap gap-2">
            {post.tags.map((t) => (
              <li key={t} className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted">
                #{t}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-16">
          <NewsletterForm newsletter={c.newsletter} source="blog" />
        </div>
      </Container>

      {related.length > 0 && (
        <Container className="mt-24">
          <h2 className="text-2xl font-extrabold tracking-tight text-text sm:text-3xl">{c.blog.relatedHeading}</h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-related>
            {related.map((p) => (
              <li key={p.slug}>
                <PostCard post={p} categoryName={nameOf(p.category)} readingLabel={c.blog.readingTimeLabel} />
              </li>
            ))}
          </ul>
        </Container>
      )}
    </article>
  );
}
