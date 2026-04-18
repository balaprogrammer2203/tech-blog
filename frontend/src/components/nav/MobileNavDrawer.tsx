import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCategoriesTreeQuery } from "@/store/baseApi";
import { categoryHref } from "@/lib/routes";
import type { User } from "@/types";

export function MobileNavDrawer({
  open,
  onClose,
  user,
  loggingOut,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  loggingOut: boolean;
  onLogout: () => void;
}) {
  const { data } = useCategoriesTreeQuery();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-label="Close menu" onClick={onClose} />
      <aside className="absolute right-0 top-0 flex h-full w-[min(100%,20rem)] flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-900">
          <span className="font-semibold text-ink dark:text-gray-100">Menu</span>
          <button
            type="button"
            className="rounded-lg p-2 text-ink-muted hover:bg-gray-100 dark:hover:bg-gray-900"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <Link to="/" className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-900" onClick={onClose}>
            Home
          </Link>
          <div className="mt-2 text-xs font-bold uppercase tracking-wider text-ink-muted">Categories</div>
          <div className="mt-1 space-y-1">
            {data?.roots.map((root) => (
              <div key={root.id} className="rounded-lg border border-gray-100 dark:border-gray-900">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-ink dark:text-gray-100"
                  aria-expanded={expanded[root.id]}
                  onClick={() => setExpanded((e) => ({ ...e, [root.id]: !e[root.id] }))}
                >
                  {root.name}
                  <svg className={`h-4 w-4 transition ${expanded[root.id] ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                  </svg>
                </button>
                {expanded[root.id] && (
                  <ul className="border-t border-gray-100 pb-2 dark:border-gray-900">
                    {root.children.map((ch) => (
                      <li key={ch.id}>
                        <Link
                          to={categoryHref(root.slug, ch.slug)}
                          className="block px-4 py-1.5 text-sm text-ink-muted hover:bg-emerald-500/10 hover:text-emerald-800 dark:hover:text-emerald-300"
                          onClick={onClose}
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
          <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-900">
            {user ? (
              <>
                <Link to="/write" className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900" onClick={onClose}>
                  Write
                </Link>
                <Link to="/me" className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900" onClick={onClose}>
                  My posts
                </Link>
                <Link to="/bookmarks" className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900" onClick={onClose}>
                  Bookmarks
                </Link>
                <button
                  type="button"
                  className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                  disabled={loggingOut}
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900" onClick={onClose}>
                  Sign in
                </Link>
                <Link to="/register" className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-900" onClick={onClose}>
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </aside>
    </div>
  );
}
