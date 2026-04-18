import { Link } from "react-router-dom";
import type { PostListItem } from "@/types";
import { categoryHref } from "@/lib/routes";

export function PostCard({ post, featured = false }: { post: PostListItem; featured?: boolean }) {
  const cat = post.category;
  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-950/60 ${
        featured ? "md:flex-row" : ""
      }`}
    >
      <Link
        to={`/p/${post.slug}`}
        className={`relative block overflow-hidden bg-gray-100 dark:bg-gray-900 ${featured ? "aspect-video md:aspect-auto md:w-1/2 md:min-h-[220px]" : "aspect-[16/10]"}`}
        aria-label={post.title}
      >
        {post.coverImageUrl ? (
          <img src={post.coverImageUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" loading="lazy" />
        ) : (
          <div className="flex h-full min-h-[140px] items-center justify-center bg-gradient-to-br from-emerald-500/10 via-gray-100 to-sky-500/10 dark:from-emerald-500/5 dark:via-gray-900 dark:to-sky-500/10">
            <span className="text-4xl font-serif font-semibold text-gray-300 dark:text-gray-700">{post.title.charAt(0)}</span>
          </div>
        )}
      </Link>
      <div className={`flex flex-1 flex-col p-5 ${featured ? "md:w-1/2 md:justify-center" : ""}`}>
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
          {cat ? (
            <>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-800 ring-1 ring-emerald-500/20 dark:text-emerald-300 dark:ring-emerald-400/25">
                {cat.parent.name}
              </span>
              <span className="text-gray-300 dark:text-gray-600" aria-hidden>
                ·
              </span>
              <Link
                to={categoryHref(cat.parent.slug, cat.slug)}
                className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-ink-muted hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
              >
                {cat.name}
              </Link>
            </>
          ) : (
            <span className="text-ink-muted">Uncategorized</span>
          )}
        </div>
        <Link to={`/p/${post.slug}`}>
          <h2
            className={`font-semibold tracking-tight text-ink group-hover:text-emerald-700 dark:text-gray-50 dark:group-hover:text-emerald-400 ${
              featured ? "text-2xl md:text-3xl" : "text-lg"
            }`}
          >
            {post.title}
          </h2>
        </Link>
        <p className={`mt-2 text-ink-muted ${featured ? "line-clamp-3 text-base" : "line-clamp-2 text-sm"}`}>{post.excerpt}</p>
        <div className="mt-auto flex flex-wrap gap-3 pt-4 text-xs text-ink-muted">
          {post.author?.name && <span>{post.author.name}</span>}
          {post.publishedAt && <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString()}</time>}
          {post.readTimeMinutes != null && <span>{post.readTimeMinutes} min read</span>}
        </div>
        {post.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 4).map((t) => (
              <span key={t.id} className="rounded-md bg-gray-50 px-2 py-0.5 text-[11px] text-ink-muted dark:bg-gray-900">
                {t.name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
