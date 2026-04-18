import { useState } from "react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setDone(true);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-emerald-500/5 to-sky-500/5 p-5 dark:border-gray-800">
      <h3 className="text-sm font-bold uppercase tracking-wide text-ink dark:text-gray-100">Newsletter</h3>
      <p className="mt-1 text-sm text-ink-muted">Weekly highlights. No spam — unsubscribe anytime.</p>
      {done ? (
        <p className="mt-3 text-sm font-medium text-emerald-700 dark:text-emerald-400" role="status">
          Thanks! You&apos;re on the list (demo — no email sent).
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <label htmlFor="nl-email" className="sr-only">
            Email address
          </label>
          <input
            id="nl-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none ring-emerald-500/0 focus:ring-2 dark:border-gray-700 dark:bg-gray-950"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
          >
            Subscribe
          </button>
        </form>
      )}
    </div>
  );
}
