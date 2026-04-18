import { useEffect, useState } from "react";
import { applyThemeClass, getStoredTheme, setStoredTheme, type ThemeMode } from "@/lib/theme";

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const stored = getStoredTheme();
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = stored ?? (prefersDark ? "dark" : "light");
    setMode(initial);
    applyThemeClass(initial);
  }, []);

  function toggle() {
    const next: ThemeMode = mode === "dark" ? "light" : "dark";
    setMode(next);
    setStoredTheme(next);
    applyThemeClass(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border border-gray-200 px-3 py-1 text-sm text-ink-muted hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600"
      aria-label="Toggle dark mode"
    >
      {mode === "dark" ? "Light" : "Dark"}
    </button>
  );
}
