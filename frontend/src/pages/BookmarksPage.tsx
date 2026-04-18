import { useState } from "react";
import { Link } from "react-router-dom";
import { useListBookmarksQuery } from "@/store/baseApi";

export function BookmarksPage() {
  const [page, setPage] = useState(1);
  const { data, isFetching } = useListBookmarksQuery({ page });

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">Bookmarks</h1>
      {isFetching && <p className="text-sm text-ink-muted">Loading…</p>}
      <div className="space-y-8">
        {data?.items.map((row) => (
          <article key={row.post.id} className="border-b border-gray-100 pb-8 last:border-0 dark:border-gray-800">
            <Link to={`/p/${row.post.slug}`} className="font-serif text-xl font-semibold hover:underline">
              {row.post.title}
            </Link>
            <p className="mt-2 text-sm text-ink-muted">{row.post.excerpt}</p>
            <p className="mt-2 text-xs text-ink-muted">
              Saved {new Date(row.bookmarkedAt).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
      {data && data.totalPages > 1 && (
        <div className="flex gap-4 text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setPage((x) => Math.max(1, x - 1))}>
            Previous
          </button>
          <button type="button" disabled={page >= data.totalPages} onClick={() => setPage((x) => x + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}
