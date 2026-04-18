import type { JSONContent } from "@tiptap/core";

/** Converts legacy markdown-ish strings to TipTap JSON (same logic as backend seed). */

export type TiptapJSON = Record<string, unknown>;

export const EMPTY_POST_DOC: JSONContent = { type: "doc", content: [{ type: "paragraph" }] };

function textNode(text: string): TiptapJSON {
  return { type: "text", text };
}

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

export function tiptapDocumentHasMeaningfulContent(doc: unknown): boolean {
  if (!doc || typeof doc !== "object") return false;
  let ok = false;
  function walk(n: unknown): void {
    if (!n || typeof n !== "object" || ok) return;
    const o = n as Record<string, unknown>;
    if (o.type === "text" && typeof o.text === "string" && o.text.trim().length > 0) ok = true;
    if (o.type === "codeBlock" && Array.isArray(o.content)) {
      for (const c of o.content) {
        const t = c as Record<string, unknown>;
        if (t?.type === "text" && typeof t.text === "string" && t.text.trim().length > 0) ok = true;
      }
    }
    if (o.type === "image" && o.attrs && typeof o.attrs === "object") {
      const src = (o.attrs as Record<string, unknown>).src;
      if (typeof src === "string" && src.trim()) ok = true;
    }
    if (Array.isArray(o.content)) for (const c of o.content) walk(c);
  }
  walk(doc);
  return ok;
}

export function normalizePostContent(raw: unknown): JSONContent {
  if (raw && typeof raw === "object" && !Array.isArray(raw) && (raw as TiptapJSON).type === "doc") {
    return raw as JSONContent;
  }
  if (typeof raw === "string") {
    return markdownSeedToTiptapDoc(raw) as JSONContent;
  }
  return EMPTY_POST_DOC;
}
