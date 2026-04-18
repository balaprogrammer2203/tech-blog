import type { Extensions } from "@tiptap/core";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import StarterKit from "@tiptap/starter-kit";
import { createLowlight } from "lowlight";
import bash from "highlight.js/lib/languages/bash.js";
import css from "highlight.js/lib/languages/css.js";
import javascript from "highlight.js/lib/languages/javascript.js";
import json from "highlight.js/lib/languages/json.js";
import xml from "highlight.js/lib/languages/xml.js";

const lowlight = createLowlight({
  javascript,
  js: javascript,
  typescript: javascript,
  ts: javascript,
  xml,
  html: xml,
  css,
  json,
  bash,
  shell: bash,
  sh: bash,
});

export function buildPostEditorExtensions(options: { placeholder?: string | false } = {}): Extensions {
  const list: Extensions = [
    StarterKit.configure({
      codeBlock: false,
      horizontalRule: false,
      heading: { levels: [1, 2, 3, 4] },
    }),
    Underline,
    Link.configure({
      openOnClick: false,
      autolink: true,
      HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
    }),
    Image.configure({ allowBase64: false, inline: false }),
    Typography,
    CodeBlockLowlight.configure({
      lowlight,
      defaultLanguage: "javascript",
    }),
  ];
  if (options.placeholder !== false) {
    list.push(
      Placeholder.configure({
        placeholder: typeof options.placeholder === "string" ? options.placeholder : "Write the article body…",
      })
    );
  }
  return list;
}
