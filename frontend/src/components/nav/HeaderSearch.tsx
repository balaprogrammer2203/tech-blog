import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useListPostsQuery } from "@/store/baseApi";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function HeaderSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const dq = useDebouncedValue(q.trim(), 280);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useListPostsQuery(
    { page: 1, limit: 8, ...(dq.length >= 2 ? { q: dq } : {}) },
    { skip: dq.length < 2 }
  );

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        wrapRef.current?.querySelector("input")?.focus();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full max-w-xs sm:max-w-sm">
      <label htmlFor="nav-search" className="sr-only">
        Search articles
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted" aria-hidden>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
          </svg>
        </span>
        <input
          id="nav-search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search… (⌘K)"
          className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-ink shadow-sm outline-none ring-emerald-500/0 transition focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/25 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls="search-suggestions"
          aria-expanded={open && dq.length >= 2}
        />
      </div>
      {open && dq.length >= 2 && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-80 overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-800 dark:bg-gray-950"
        >
          {isFetching && <div className="px-3 py-2 text-sm text-ink-muted">Searching…</div>}
          {!isFetching && data?.items.length === 0 && <div className="px-3 py-2 text-sm text-ink-muted">No matches</div>}
          {data?.items.map((p) => (
            <Link
              key={p.id}
              role="option"
              to={`/p/${p.slug}`}
              className="block border-b border-gray-50 px-3 py-2 last:border-0 hover:bg-gray-50 dark:border-gray-900 dark:hover:bg-gray-900"
              onClick={() => {
                setOpen(false);
                setQ("");
              }}
            >
              <div className="font-medium text-ink dark:text-gray-100">{p.title}</div>
              <div className="truncate text-xs text-ink-muted">{p.excerpt}</div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
