import { useEffect } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { Box, Typography } from "@mui/material";
import { buildPostEditorExtensions } from "./extensions";
import "./tiptapArticle.css";

export function PostTiptapViewer({ doc }: { doc: JSONContent }) {
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
    return (
      <Typography variant="body2" color="text.secondary">
        Loading…
      </Typography>
    );
  }

  return (
    <Box className="tiptap-article">
      <EditorContent editor={editor} />
    </Box>
  );
}
