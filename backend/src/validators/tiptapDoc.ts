/** Server-side validation for TipTap / ProseMirror JSON documents (no HTML storage). */

const MAX_SERIALIZED_BYTES = 512 * 1024;
const MAX_NODES = 12_000;
const MAX_DEPTH = 48;

const ALLOWED_BLOCK_NODES = new Set([
  "doc",
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "image",
]);

const ALLOWED_MARKS = new Set(["bold", "italic", "underline", "strike", "code", "link"]);

const CODE_LANGUAGES = new Set([
  "",
  "plaintext",
  "text",
  "javascript",
  "js",
  "typescript",
  "ts",
  "html",
  "xml",
  "css",
  "json",
  "bash",
  "shell",
  "sh",
]);

function isSafeHttpUrl(href: string): boolean {
  try {
    const u = new URL(href);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

function walkNode(node: unknown, depth: number, state: { count: number }): boolean {
  if (depth > MAX_DEPTH || state.count > MAX_NODES) return false;
  if (node === null || typeof node !== "object" || Array.isArray(node)) return false;
  state.count += 1;

  const n = node as Record<string, unknown>;
  const type = n.type;
  if (typeof type !== "string") return false;

  if (type === "text") {
    if (typeof n.text !== "string" || n.text.length > 50_000) return false;
    if (n.marks !== undefined) {
      if (!Array.isArray(n.marks)) return false;
      for (const m of n.marks) {
        if (!m || typeof m !== "object") return false;
        const mark = m as Record<string, unknown>;
        if (typeof mark.type !== "string" || !ALLOWED_MARKS.has(mark.type)) return false;
        if (mark.type === "link") {
          const attrs = mark.attrs;
          if (!attrs || typeof attrs !== "object") return false;
          const href = (attrs as Record<string, unknown>).href;
          if (typeof href !== "string" || href.length > 2000 || !isSafeHttpUrl(href)) return false;
        }
      }
    }
    return true;
  }

  if (type === "hardBreak") return true;

  if (!ALLOWED_BLOCK_NODES.has(type)) return false;

  if (n.marks !== undefined) return false;

  if (type === "doc") {
    if (!Array.isArray(n.content)) return false;
    return n.content.every((c) => walkNode(c, depth + 1, state));
  }

  if (type === "heading") {
    const attrs = n.attrs;
    const level = attrs && typeof attrs === "object" ? (attrs as Record<string, unknown>).level : undefined;
    if (typeof level !== "number" || level < 1 || level > 4) return false;
    if (!Array.isArray(n.content)) return false;
    return n.content.every((c) => walkNode(c, depth + 1, state));
  }

  if (type === "codeBlock") {
    const attrs = n.attrs;
    if (attrs !== undefined && (typeof attrs !== "object" || attrs === null)) return false;
    const lang =
      attrs && typeof attrs === "object"
        ? String((attrs as Record<string, unknown>).language ?? "").toLowerCase()
        : "";
    if (!CODE_LANGUAGES.has(lang)) return false;
    const codeChildren = Array.isArray(n.content) ? n.content : [];
    for (const c of codeChildren) {
      if (!c || typeof c !== "object") return false;
      const cn = c as Record<string, unknown>;
      if (cn.type !== "text") return false;
      if (typeof cn.text !== "string" || cn.text.length > 100_000) return false;
      if (cn.marks !== undefined) return false;
    }
    return true;
  }

  if (type === "image") {
    const attrs = n.attrs;
    if (!attrs || typeof attrs !== "object") return false;
    const src = (attrs as Record<string, unknown>).src;
    if (typeof src !== "string" || src.length > 2000 || !isSafeHttpUrl(src)) return false;
    const alt = (attrs as Record<string, unknown>).alt;
    if (alt !== undefined && typeof alt !== "string") return false;
    return true;
  }

  if (type === "paragraph" || type === "blockquote" || type === "listItem") {
    const children = Array.isArray(n.content) ? n.content : [];
    return children.every((c) => walkNode(c, depth + 1, state));
  }

  if (type === "bulletList" || type === "orderedList") {
    if (n.attrs !== undefined && (typeof n.attrs !== "object" || n.attrs === null || Array.isArray(n.attrs))) {
      return false;
    }
    if (n.attrs && typeof n.attrs === "object") {
      const start = (n.attrs as Record<string, unknown>).start;
      if (start !== undefined && (typeof start !== "number" || !Number.isFinite(start) || start < 1)) return false;
    }
    const children = Array.isArray(n.content) ? n.content : [];
    for (const c of children) {
      if (!c || typeof c !== "object") return false;
      if ((c as Record<string, unknown>).type !== "listItem") return false;
      if (!walkNode(c, depth + 1, state)) return false;
    }
    return true;
  }

  return false;
}

export function assertValidTiptapContent(value: unknown): void {
  if (typeof value !== "object" || value === null) {
    throw new Error("Content must be a TipTap JSON object");
  }
  const serialized = JSON.stringify(value);
  if (serialized.length > MAX_SERIALIZED_BYTES) {
    throw new Error("Content document is too large");
  }
  const root = value as Record<string, unknown>;
  if (root.type !== "doc") {
    throw new Error("Content root must be type doc");
  }
  const state = { count: 0 };
  if (!walkNode(value, 0, state)) {
    throw new Error("Content uses disallowed nodes, marks, or structure");
  }
}

export function isTiptapDoc(value: unknown): value is Record<string, unknown> {
  try {
    assertValidTiptapContent(value);
    return true;
  } catch {
    return false;
  }
}

/** True if the document has visible body (text, non-empty code, or an image). */
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
