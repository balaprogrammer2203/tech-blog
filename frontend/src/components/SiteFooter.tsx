import { Link } from "react-router-dom";

export function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50/80 dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-sm font-bold text-ink dark:text-gray-100">DevWrite</div>
            <p className="mt-2 text-sm text-ink-muted">Enterprise-grade programming blog — depth, clarity, and fast loads.</p>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">Explore</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/" className="text-ink-muted hover:text-emerald-700 dark:hover:text-emerald-400">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-ink-muted hover:text-emerald-700 dark:hover:text-emerald-400">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-ink-muted hover:text-emerald-700 dark:hover:text-emerald-400">
                  Create account
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">Authors</div>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link to="/me" className="text-ink-muted hover:text-emerald-700 dark:hover:text-emerald-400">
                  Your posts
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-ink-muted">Social</div>
            <div className="mt-3 flex gap-3 text-ink-muted">
              <a href="https://github.com" className="hover:text-ink dark:hover:text-gray-200" aria-label="GitHub" target="_blank" rel="noreferrer">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" />
                </svg>
              </a>
              <a href="https://twitter.com" className="hover:text-ink dark:hover:text-gray-200" aria-label="X / Twitter" target="_blank" rel="noreferrer">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        <p className="mt-10 text-center text-xs text-ink-muted">© {new Date().getFullYear()} DevWrite. Built for readers and builders.</p>
      </div>
    </footer>
  );
}
