import Image from "next/image";
import Link from "next/link";
import { formatPostDate } from "@/lib/blog/posts";
import type { BlogPost } from "@/lib/content/types";
import { ArrowRight } from "../Icons";

/** next/image optimises only local files and the public media bucket (next.config.ts). */
export const optimisable = (src: string) => src.startsWith("/") || /^https:\/\/[^/]+\.neon\.tech\/public-assets\//.test(src);

export function PostMeta({ post, categoryName, readingLabel }: { post: BlogPost; categoryName: string | null; readingLabel: string }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-[0.15em] text-muted">
      {categoryName && <span>{categoryName}</span>}
      {post.publishedAt && <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>}
      <span>
        {post.readingMinutes} {readingLabel}
      </span>
    </p>
  );
}

export function PostCard({ post, categoryName, readingLabel, priority = false }: { post: BlogPost; categoryName: string | null; readingLabel: string; priority?: boolean }) {
  return (
    <Link href={`/blog/${post.slug}`} data-post={post.slug} className="glow group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-surface">
      {post.coverImage ? (
        <div className="relative aspect-[16/9] overflow-hidden border-b border-border">
          <Image
            src={post.coverImage}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            priority={priority}
            unoptimized={!optimisable(post.coverImage)}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-7">
        <div className="flex items-center justify-between gap-3">
          <PostMeta post={post} categoryName={categoryName} readingLabel={readingLabel} />
          {post.isDraft && <span className="rounded-full bg-btn-bg px-2.5 py-0.5 text-xs font-semibold text-btn-fg">Draft</span>}
        </div>
        <h3 className="mt-4 text-xl font-extrabold tracking-tight text-text">{post.title}</h3>
        <p className="mt-3 flex-1 leading-relaxed text-muted">{post.excerpt}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-text">
          Read the post
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
