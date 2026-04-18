import { useState } from "react";
import { Link } from "react-router-dom";
import { useCategoriesTreeQuery, useListPostsQuery } from "@/store/baseApi";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { categoryHref } from "@/lib/routes";

export function HomeSidebar() {
  const { data: tree } = useCategoriesTreeQuery();
  const { data: popular } = useListPostsQuery({ page: 1, limit: 5 });
  const [openRoots, setOpenRoots] = useState<Record<string, boolean>>({});

  return (
    <aside className="space-y-8 lg:sticky lg:top-24 lg:self-start">
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Popular</h3>
        <ul className="mt-3 space-y-3">
          {popular?.items.map((p) => (
            <li key={p.id}>
              <Link to={`/p/${p.slug}`} className="group block">
                <span className="line-clamp-2 text-sm font-semibold text-ink group-hover:text-emerald-700 dark:text-gray-100 dark:group-hover:text-emerald-400">
                  {p.title}
                </span>
                <span className="mt-0.5 block text-xs text-ink-muted">
                  {p.likeCount} likes · {p.commentCount} comments
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-ink-muted">Categories</h3>
        <div className="mt-3 space-y-1">
          {tree?.roots.map((root) => (
            <div key={root.id} className="rounded-lg border border-gray-100 dark:border-gray-800">
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-ink dark:text-gray-100"
                aria-expanded={openRoots[root.id] ?? true}
                onClick={() => setOpenRoots((o) => ({ ...o, [root.id]: !(o[root.id] ?? true) }))}
              >
                {root.name}
                <svg
                  className={`h-4 w-4 shrink-0 text-ink-muted transition ${openRoots[root.id] === false ? "-rotate-90" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                </svg>
              </button>
              {(openRoots[root.id] ?? true) && (
                <ul className="border-t border-gray-100 pb-1 dark:border-gray-800">
                  {root.children.map((ch) => (
                    <li key={ch.id}>
                      <Link
                        to={categoryHref(root.slug, ch.slug)}
                        className="block px-4 py-1.5 text-sm text-ink-muted hover:bg-emerald-500/10 hover:text-emerald-800 dark:hover:text-emerald-300"
                      >
                        {ch.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <NewsletterSignup />
    </aside>
  );
}
