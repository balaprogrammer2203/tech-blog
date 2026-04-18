/**
 * Converts seed / legacy markdown-ish strings into a minimal TipTap JSON document.
 * Headings (#–####) become heading nodes; other blocks become paragraphs.
 */

export type TiptapJSON = Record<string, unknown>;

function textNode(text: string): TiptapJSON {
  return { type: "text", text };
}

/** Public helper for seed script; same shape as stored post content. */
export function markdownSeedToTiptapDoc(md: string): TiptapJSON {
  const lines = md.split("\n");
  const content: TiptapJSON[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    if (heading) {
      content.push({
        type: "heading",
        attrs: { level: heading[1].length },
        content: [textNode(heading[2])],
      });
      i += 1;
      continue;
    }

    const blockLines: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4})\s+/.test(lines[i])) {
      blockLines.push(lines[i]);
      i += 1;
    }
    const text = blockLines.join("\n");
    if (text.trim()) {
      content.push({
        type: "paragraph",
        content: [textNode(text)],
      });
    }
  }

  if (content.length === 0) {
    content.push({ type: "paragraph", content: [textNode("\u00a0")] });
  }

  return { type: "doc", content };
}
