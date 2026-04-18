import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useListPostsQuery } from "@/store/baseApi";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function HomePage() {
  const [page, setPage] = useState(1);
  const [qInput, setQInput] = useState("");
  const q = useDebouncedValue(qInput.trim(), 400);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const args = useMemo(() => ({ page, limit: 12, ...(q ? { q } : {}) }), [page, q]);
  const { data, isFetching, isError, refetch } = useListPostsQuery(args);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink dark:text-gray-50">
          Programming &amp; systems writing
        </h1>
        <p className="mt-3 max-w-xl text-ink-muted">
          A minimal, Medium-inspired reader focused on technical depth and fast loads.
        </p>
      </div>
      <div>
        <label htmlFor="search" className="sr-only">
          Search articles
        </label>
        <input
          id="search"
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="Search (debounced)…"
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-emerald-500/30 focus:ring-2 dark:border-gray-700 dark:bg-gray-900"
        />
      </div>
      {isError && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-100">
          Could not load posts.{" "}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      )}
      <div className="space-y-10">
        {data?.items.map((post) => (
          <article key={post.id} className="border-b border-gray-100 pb-10 last:border-0 dark:border-gray-800">
            <Link to={`/p/${post.slug}`} className="group block">
              <h2 className="font-serif text-2xl font-semibold text-ink group-hover:underline dark:text-gray-50">
                {post.title}
              </h2>
              <p className="mt-2 text-ink-muted">{post.excerpt}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-ink-muted">
                {post.author?.name && <span>{post.author.name}</span>}
                {post.readTimeMinutes != null && <span>{post.readTimeMinutes} min read</span>}
                {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
              </div>
              {post.tags?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((t) => (
                    <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
            </Link>
          </article>
        ))}
      </div>
      {isFetching && <p className="text-sm text-ink-muted">Loading…</p>}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40 dark:border-gray-700"
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
            className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40 dark:border-gray-700"
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
