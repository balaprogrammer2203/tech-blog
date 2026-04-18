import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useListPostsQuery } from "@/store/baseApi";
import { PostCard } from "@/components/PostCard";
import { SplitPageLayout } from "@/components/SplitPageLayout";
import { categoryHref } from "@/lib/routes";

export function HomePage() {
  const [page, setPage] = useState(1);
  const args = useMemo(() => ({ page, limit: 12 }), [page]);
  const { data, isFetching, isError, refetch } = useListPostsQuery(args);

  const featured = page === 1 ? data?.items[0] : undefined;
  const rest = data ? (page === 1 ? (data.items.length > 1 ? data.items.slice(1) : []) : data.items) : [];

  return (
    <SplitPageLayout>
      <div className="space-y-10">
        <section className="rounded-2xl border border-gray-200/80 bg-gradient-to-br from-white via-gray-50/50 to-emerald-500/[0.07] px-6 py-10 dark:border-gray-800 dark:from-gray-950 dark:via-gray-950 dark:to-emerald-500/10 md:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400">Technical blog</p>
          <h1 className="mt-2 max-w-3xl font-serif text-3xl font-semibold tracking-tight text-ink dark:text-gray-50 md:text-4xl lg:text-5xl">
            Depth-first writing for engineers
          </h1>
          <p className="mt-4 max-w-2xl text-base text-ink-muted md:text-lg">
            Architecture, languages, and shipping — with a reader-first layout, responsive navigation, and curated categories.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#latest"
              className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              Browse latest
            </a>
          </div>
        </section>

        {featured && (
          <section aria-labelledby="featured-heading">
            <h2 id="featured-heading" className="sr-only">
              Featured article
            </h2>
            <PostCard post={featured} featured />
          </section>
        )}

        <section id="latest" className="scroll-mt-28">
          <div className="mb-6 flex flex-col gap-2 border-b border-gray-100 pb-4 dark:border-gray-800 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-ink dark:text-gray-50">Latest articles</h2>
              <p className="text-sm text-ink-muted">Newest published posts site-wide.</p>
            </div>
            {featured?.category && (
              <Link
                to={categoryHref(featured.category.parent.slug, featured.category.slug)}
                className="text-sm font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
              >
                View {featured.category.name} →
              </Link>
            )}
          </div>

          {isError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/40">
              Could not load posts.{" "}
              <button type="button" className="underline" onClick={() => void refetch()}>
                Retry
              </button>
            </div>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          {isFetching && <p className="text-sm text-ink-muted">Loading…</p>}

          {data && data.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-between gap-4 border-t border-gray-100 pt-6 text-sm dark:border-gray-800">
              <button
                type="button"
                disabled={page <= 1}
                className="rounded-lg border border-gray-200 px-4 py-2 font-medium disabled:opacity-40 dark:border-gray-700"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-ink-muted">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                type="button"
                disabled={page >= data.totalPages}
                className="rounded-lg border border-gray-200 px-4 py-2 font-medium disabled:opacity-40 dark:border-gray-700"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </section>
      </div>
    </SplitPageLayout>
  );
}
