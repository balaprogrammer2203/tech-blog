import { Link } from "react-router-dom";

export type Crumb = { label: string; to?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((c, i) => (
          <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-gray-300 dark:text-gray-600" aria-hidden>/</span>}
            {c.to ? (
              <Link to={c.to} className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                {c.label}
              </Link>
            ) : (
              <span
                className={
                  i === items.length - 1
                    ? "font-semibold text-ink dark:text-gray-200"
                    : "font-medium text-ink-muted"
                }
              >
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
