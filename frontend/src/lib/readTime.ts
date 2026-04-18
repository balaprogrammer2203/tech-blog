const WPM = 225;

export function estimateReadMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / WPM));
}

function countWordsInUnknownDoc(doc: unknown): number {
  let words = 0;
  function walk(n: unknown): void {
    if (!n || typeof n !== "object") return;
    const o = n as Record<string, unknown>;
    if (o.type === "text" && typeof o.text === "string") {
      words += o.text.trim().split(/\s+/).filter(Boolean).length;
    }
    if (Array.isArray(o.content)) for (const c of o.content) walk(c);
  }
  walk(doc);
  return words;
}

/** Supports legacy markdown string or TipTap JSON. */
export function estimateReadMinutesFromPost(content: unknown): number {
  if (typeof content === "string") return estimateReadMinutes(content);
  const words = countWordsInUnknownDoc(content);
  return Math.max(1, Math.round(words / WPM));
}
