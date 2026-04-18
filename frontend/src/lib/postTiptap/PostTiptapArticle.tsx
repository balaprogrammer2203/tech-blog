import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { buildPostEditorExtensions } from "./extensions";
import "./tiptapArticle.css";

/** Read-only TipTap renderer for published post JSON. */
export function PostTiptapArticle({ doc }: { doc: JSONContent }) {
  const editor = useEditor({
    extensions: buildPostEditorExtensions({ placeholder: false }),
    content: doc,
    editable: false,
    editorProps: {
      attributes: {
        class: "ProseMirror",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(doc, false);
  }, [editor, doc]);

  if (!editor) {
    return <p className="text-sm text-ink-muted">Loading…</p>;
  }

  return (
    <div className="tiptap-article">
      <EditorContent editor={editor} />
    </div>
  );
}
