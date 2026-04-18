import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCategoriesTreeQuery, useListPostsQuery } from "@/store/baseApi";
import type { PublicCategoryChild, PublicCategoryRoot } from "@/types";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { PostCard } from "@/components/PostCard";

type CategoryResolved = { root: PublicCategoryRoot; child: PublicCategoryChild };

export function CategoryPage() {
  const { parentSlug = "", childSlug = "" } = useParams();
  const [page, setPage] = useState(1);
  const { data: tree, isLoading: treeLoading } = useCategoriesTreeQuery();

  const resolved = useMemo((): CategoryResolved | { error: "unknown-root" } | { error: "unknown-child" } | null => {
    if (!tree?.roots.length) return null;
    const root = tree.roots.find((r) => r.slug === parentSlug);
    if (!root) return { error: "unknown-root" as const };
    const child = root.children.find((c) => c.slug === childSlug);
    if (!child) return { error: "unknown-child" as const };
    return { root, child };
  }, [tree, parentSlug, childSlug]);

  const ok = resolved !== null && !("error" in resolved);
  const categorySlug = ok ? resolved.child.slug : "";

  const { data, isFetching, isError, refetch } = useListPostsQuery(
    { page, limit: 12, categorySlug },
    { skip: !ok }
  );

  useEffect(() => {
    setPage(1);
  }, [parentSlug, childSlug]);

  if (treeLoading || !tree) {
    return <p className="text-sm text-ink-muted">Loading…</p>;
  }

  if (!resolved || "error" in resolved) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        <h1 className="text-lg font-semibold">Category not found</h1>
        <p className="mt-2 text-sm">This topic path does not exist.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-semibold text-emerald-700 underline dark:text-emerald-400">
          Back to home
        </Link>
      </div>
    );
  }

  const { root, child } = resolved;

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: root.name },
          { label: child.name },
        ]}
      />
      <header className="space-y-2 border-b border-gray-100 pb-8 dark:border-gray-800">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">{root.name}</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink dark:text-gray-50 md:text-4xl">{child.name}</h1>
        <p className="max-w-2xl text-ink-muted">Articles filed under this subcategory.</p>
      </header>

      {isError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/40">
          Could not load posts.{" "}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        {data?.items.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {isFetching && <p className="text-sm text-ink-muted">Loading…</p>}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-6 text-sm dark:border-gray-800">
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
    </div>
  );
}
