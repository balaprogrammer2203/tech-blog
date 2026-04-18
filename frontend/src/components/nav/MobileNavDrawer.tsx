import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useCategoriesTreeQuery } from "@/store/baseApi";
import { categoryHref } from "@/lib/routes";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  const { data, isLoading: treeLoading, isFetching: treeFetching } = useCategoriesTreeQuery();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) setExpanded({});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useLayoutEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  if (!open) return null;

  const roots = data?.roots ?? [];
  const treeBusy = treeLoading || treeFetching;

  return (
    <div className="fixed inset-0 z-[60] md:hidden" role="dialog" aria-modal="true" aria-label="Site menu">
      <button type="button" className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-label="Close menu" onClick={onClose} />
      <aside
        id="site-mobile-nav"
        className="absolute right-0 top-0 flex h-full w-[min(100%,22rem)] flex-col border-l border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-950"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-900">
          <span className="font-semibold text-ink dark:text-gray-100">Menu</span>
          <button
            ref={closeBtnRef}
            type="button"
            className="rounded-lg p-2 text-ink-muted hover:bg-gray-100 dark:hover:bg-gray-900"
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3" aria-label="Mobile">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Site</p>
          <Link
            to="/"
            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-900"
            onClick={onClose}
          >
            Home
          </Link>
          {user ? (
            <>
              <Link
                to="/write"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-900"
                onClick={onClose}
              >
                Write
              </Link>
              <Link
                to="/me"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-900"
                onClick={onClose}
              >
                My posts
              </Link>
              <Link
                to="/bookmarks"
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-900"
                onClick={onClose}
              >
                Bookmarks
              </Link>
            </>
          ) : null}

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-900">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Categories</p>
            {treeBusy && !roots.length ? (
              <p className="px-3 py-2 text-sm text-ink-muted">Loading categories…</p>
            ) : roots.length === 0 ? (
              <p className="px-3 py-2 text-sm text-ink-muted">No categories yet.</p>
            ) : (
              <div className="space-y-1">
                {roots.map((root) => {
                  const hasChildren = root.children.length > 0;
                  if (!hasChildren) {
                    return (
                      <div
                        key={root.id}
                        className="rounded-lg border border-gray-100 px-3 py-2 text-sm text-ink-muted dark:border-gray-900"
                      >
                        {root.name}
                      </div>
                    );
                  }
                  return (
                    <div key={root.id} className="rounded-lg border border-gray-100 dark:border-gray-900">
                      <button
                        type="button"
                        className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-ink dark:text-gray-100"
                        aria-expanded={!!expanded[root.id]}
                        onClick={() => setExpanded((e) => ({ ...e, [root.id]: !e[root.id] }))}
                      >
                        {root.name}
                        <svg
                          className={`h-4 w-4 shrink-0 transition ${expanded[root.id] ? "rotate-180" : ""}`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
                        </svg>
                      </button>
                      {expanded[root.id] ? (
                        <ul className="border-t border-gray-100 pb-2 dark:border-gray-900">
                          {root.children.map((ch) => (
                            <li key={ch.id}>
                              <Link
                                to={categoryHref(root.slug, ch.slug)}
                                className="block px-4 py-2 text-sm text-ink-muted hover:bg-emerald-500/10 hover:text-emerald-800 dark:hover:text-emerald-300"
                                onClick={onClose}
                              >
                                {ch.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-900">
            <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Account</p>
            {user ? (
              <>
                <p className="truncate px-3 py-1 text-sm font-medium text-ink dark:text-gray-100">{user.name}</p>
                <p className="truncate px-3 pb-2 text-xs text-ink-muted">{user.email}</p>
                <button
                  type="button"
                  className="w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
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
                <Link
                  to="/login"
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-900"
                  onClick={onClose}
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="mt-1 block rounded-lg bg-emerald-600 px-3 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  onClick={onClose}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 dark:border-gray-900">
          <span className="text-sm text-ink-muted">Theme</span>
          <ThemeToggle />
        </div>
      </aside>
    </div>
  );
}
