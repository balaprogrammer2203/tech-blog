import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCategoriesTreeQuery } from "@/store/baseApi";
import { categoryHref } from "@/lib/routes";

const CLOSE_MS = 160;

export function CategoryNavBar() {
  const { data } = useCategoriesTreeQuery();
  const roots = data?.roots ?? [];
  const [activeId, setActiveId] = useState<string | null>(null);
  const closeTimer = useRef<number>(0);
  const baseId = useId();

  const cancelClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
  }, []);

  const scheduleClose = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setActiveId(null), CLOSE_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const activeRoot = activeId ? roots.find((r) => r.id === activeId) : undefined;

  if (!roots.length) return null;

  return (
    <div
      className="relative w-full overflow-visible border-t border-gray-200/90 pt-2 dark:border-gray-800"
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
    >
      <div className="relative w-full">
        <nav aria-label="Browse by category" className="relative z-10 flex flex-wrap items-stretch gap-0">
          {roots.map((root) => {
            const open = activeId === root.id;
            return (
              <button
                key={root.id}
                type="button"
                className={`relative border-b-2 px-3 py-2 text-sm font-semibold tracking-tight transition ${
                  open
                    ? "border-emerald-600 text-ink dark:border-emerald-400 dark:text-gray-50"
                    : "border-transparent text-ink-muted hover:bg-white/80 hover:text-ink dark:hover:bg-gray-950/60 dark:hover:text-gray-200"
                }`}
                aria-expanded={open}
                aria-controls={`${baseId}-submenu`}
                onMouseEnter={() => {
                  cancelClose();
                  setActiveId(root.id);
                }}
                onFocus={() => {
                  cancelClose();
                  setActiveId(root.id);
                }}
              >
                {root.name}
              </button>
            );
          })}
        </nav>

        {activeRoot?.children?.length ? (
          <div
            id={`${baseId}-submenu`}
            role="region"
            aria-label={`${activeRoot.name} subcategories`}
            className="absolute left-0 right-0 top-full z-[100] pt-1 -mt-1"
            onMouseEnter={cancelClose}
          >
            <div className="rounded-b-xl border border-t-0 border-gray-200/95 bg-white/95 py-3 shadow-2xl shadow-black/15 ring-1 ring-black/5 backdrop-blur-md dark:border-gray-700 dark:bg-gray-950/95 dark:ring-white/10">
              <div className="flex flex-wrap gap-2 px-1 pb-1 sm:gap-3 sm:px-2">
                {activeRoot.children.map((ch) => (
                  <Link
                    key={ch.id}
                    to={categoryHref(activeRoot.slug, ch.slug)}
                    className="rounded-lg border border-transparent px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:border-emerald-500/25 hover:bg-emerald-500/10 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:hover:text-emerald-300"
                    onClick={() => setActiveId(null)}
                  >
                    {ch.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
