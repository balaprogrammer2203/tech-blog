import { assertValidTiptapContent } from "../validators/tiptapDoc.js";

/** Published seed post: React hooks with JS / HTML / CSS code blocks (react-js leaf). */
export const SEED_REACT_TIPTAP_HOOKS_SNIPPETS = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "This seeded article lives under the React.js subcategory and exercises TipTap ",
        },
        { type: "text", marks: [{ type: "bold" }], text: "codeBlock" },
        {
          type: "text",
          text: " nodes with JavaScript, HTML, and CSS so you can verify syntax highlighting in the admin editor and on the public site.",
        },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "JavaScript (custom hook sketch)" }] },
    {
      type: "codeBlock",
      attrs: { language: "javascript" },
      content: [
        {
          type: "text",
          text: `import { useEffect, useState } from "react";

export function useWindowTitle(title) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    document.title = title;
    setReady(true);
    return () => {
      document.title = "Tech Blog";
    };
  }, [title]);
  return ready;
}`,
        },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "HTML (mount point)" }] },
    {
      type: "codeBlock",
      attrs: { language: "html" },
      content: [
        {
          type: "text",
          text: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>React demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
        },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "CSS (layout shell)" }] },
    {
      type: "codeBlock",
      attrs: { language: "css" },
      content: [
        {
          type: "text",
          text: `:root {
  color-scheme: light dark;
  font-family: system-ui, sans-serif;
}

#root {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 1.5rem;
}

.card {
  max-width: 40rem;
  border-radius: 0.75rem;
  padding: 1.25rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
}`,
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Scroll the code blocks horizontally on small screens; the public article page lazy-loads the same TipTap renderer used in admin preview.",
        },
      ],
    },
  ],
} as const;

/** Second published seed post under react-js with different snippets. */
export const SEED_REACT_TIPTAP_COMPONENT_STYLES = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Companion seed post for the React.js leaf category. It includes another trio of fenced-style ",
        },
        { type: "text", marks: [{ type: "italic" }], text: "codeBlock" },
        { type: "text", text: " sections (JS, HTML, CSS) to regression-test lowlight registration." },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "JavaScript (tiny counter)" }] },
    {
      type: "codeBlock",
      attrs: { language: "javascript" },
      content: [
        {
          type: "text",
          text: `export function createCounter(initial = 0) {
  let n = initial;
  return {
    value: () => n,
    inc: () => {
      n += 1;
      return n;
    },
  };
}`,
        },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "HTML (accessible button)" }] },
    {
      type: "codeBlock",
      attrs: { language: "html" },
      content: [
        {
          type: "text",
          text: `<button type="button" class="btn" aria-pressed="false">
  Save draft
</button>`,
        },
      ],
    },
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "CSS (button focus ring)" }] },
    {
      type: "codeBlock",
      attrs: { language: "css" },
      content: [
        {
          type: "text",
          text: `.btn {
  border-radius: 0.5rem;
  padding: 0.5rem 0.9rem;
  border: 1px solid #4f46e5;
  background: #eef2ff;
  color: #312e81;
}

.btn:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}`,
        },
      ],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: "Open this post on the frontend under the React.js category to confirm blocks render and highlight correctly." }],
    },
  ],
} as const;

assertValidTiptapContent(SEED_REACT_TIPTAP_HOOKS_SNIPPETS);
assertValidTiptapContent(SEED_REACT_TIPTAP_COMPONENT_STYLES);
