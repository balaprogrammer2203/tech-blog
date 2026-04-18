import { useState } from "react";
import { Link } from "react-router-dom";
import { useGetMyPostsQuery, useDeletePostMutation } from "@/store/baseApi";

export function MyPostsPage() {
  const [page, setPage] = useState(1);
  const { data, isFetching } = useGetMyPostsQuery({ page });
  const [remove] = useDeletePostMutation();

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">My posts</h1>
      {isFetching && <p className="text-sm text-ink-muted">Loading…</p>}
      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
        {data?.items.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link className="font-medium hover:underline" to={`/p/${p.slug}`}>
                {p.title}
              </Link>
              <p className="text-xs text-ink-muted">
                {p.status} · updated {p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "—"}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                className="rounded border border-red-200 px-2 py-1 text-red-700 dark:border-red-900 dark:text-red-300"
                onClick={() => {
                  if (window.confirm("Delete this post?")) void remove(p.id);
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
      {data && data.totalPages > 1 && (
        <div className="flex gap-4 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            className="underline disabled:opacity-40"
            onClick={() => setPage((x) => Math.max(1, x - 1))}
          >
            Previous
          </button>
          <span className="text-ink-muted">
            Page {data.page} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= data.totalPages}
            className="underline disabled:opacity-40"
            onClick={() => setPage((x) => x + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
