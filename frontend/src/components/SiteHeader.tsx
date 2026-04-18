import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { useLogoutMutation } from "@/store/baseApi";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CategoryNavBar } from "@/components/nav/CategoryNavBar";
import { HeaderSearch } from "@/components/nav/HeaderSearch";
import { MobileNavDrawer } from "@/components/nav/MobileNavDrawer";

export function SiteHeader() {
  const user = useAppSelector((s) => s.auth.user);
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/90 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
            <button
              type="button"
              className="inline-flex rounded-lg p-2 text-ink-muted hover:bg-gray-100 md:hidden dark:hover:bg-gray-900"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link to="/" className="truncate text-lg font-bold tracking-tight text-ink transition hover:text-emerald-700 dark:text-gray-50 dark:hover:text-emerald-400">
              DevWrite
            </Link>
          </div>

          <nav className="hidden flex-1 items-center justify-center gap-1 md:flex" aria-label="Primary">
            <Link
              to="/"
              className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-gray-100 hover:text-ink dark:hover:bg-gray-900 dark:hover:text-gray-100"
            >
              Home
            </Link>
            {user ? (
              <>
                <Link
                  to="/write"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-gray-100 hover:text-ink dark:hover:bg-gray-900 dark:hover:text-gray-100"
                >
                  Write
                </Link>
                <Link
                  to="/me"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-gray-100 hover:text-ink dark:hover:bg-gray-900 dark:hover:text-gray-100"
                >
                  My posts
                </Link>
                <Link
                  to="/bookmarks"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition hover:bg-gray-100 hover:text-ink dark:hover:bg-gray-900 dark:hover:text-gray-100"
                >
                  Bookmarks
                </Link>
              </>
            ) : null}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 md:flex-none md:max-w-none">
            <div className="hidden min-w-0 sm:block sm:max-w-[14rem] md:max-w-xs">
              <HeaderSearch />
            </div>
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Account">
              {user ? (
                <>
                  <span className="hidden max-w-[7rem] truncate text-xs text-ink-muted lg:inline">{user.name}</span>
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1.5 text-sm text-ink-muted hover:bg-gray-100 dark:hover:bg-gray-900"
                    disabled={loggingOut}
                    onClick={() => void logout()}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="rounded-lg px-2 py-1.5 text-sm text-ink-muted hover:bg-gray-100 dark:hover:bg-gray-900">
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Register
                  </Link>
                </>
              )}
            </nav>
            <ThemeToggle />
          </div>
        </div>
        <CategoryNavBar />
        <div className="border-t border-gray-100 px-4 py-2 sm:hidden dark:border-gray-900">
          <HeaderSearch />
        </div>
      </header>
      <MobileNavDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        user={user}
        loggingOut={loggingOut}
        onLogout={() => void logout()}
      />
    </>
  );
}
