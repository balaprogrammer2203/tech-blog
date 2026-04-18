import { Link, Outlet } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { useLogoutMutation } from "@/store/baseApi";
import { ThemeToggle } from "./ThemeToggle";

export function Layout() {
  const user = useAppSelector((s) => s.auth.user);
  const [logout, { isLoading: loggingOut }] = useLogoutMutation();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-black/40">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight text-ink dark:text-gray-100">
            DevWrite
          </Link>
          <nav className="flex flex-wrap items-center gap-3 text-sm text-ink-muted">
            <Link className="hover:text-ink dark:hover:text-gray-200" to="/">
              Home
            </Link>
            {user ? (
              <>
                <Link className="hover:text-ink dark:hover:text-gray-200" to="/write">
                  Write
                </Link>
                <Link className="hover:text-ink dark:hover:text-gray-200" to="/me">
                  My posts
                </Link>
                <Link className="hover:text-ink dark:hover:text-gray-200" to="/bookmarks">
                  Bookmarks
                </Link>
                <span className="hidden sm:inline">{user.name}</span>
                <button
                  type="button"
                  className="hover:text-ink dark:hover:text-gray-200"
                  disabled={loggingOut}
                  onClick={() => void logout()}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link className="hover:text-ink dark:hover:text-gray-200" to="/login">
                  Sign in
                </Link>
                <Link className="hover:text-ink dark:hover:text-gray-200" to="/register">
                  Register
                </Link>
              </>
            )}
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 py-8 text-center text-xs text-ink-muted dark:border-gray-800">
        Optimized for free-tier hosting. Backend may cold-start; requests retry automatically.
      </footer>
    </div>
  );
}
