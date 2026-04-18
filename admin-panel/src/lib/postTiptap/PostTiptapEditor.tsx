import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatUnderlinedIcon from "@mui/icons-material/FormatUnderlined";
import CodeIcon from "@mui/icons-material/Code";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import LinkIcon from "@mui/icons-material/Link";
import ImageIcon from "@mui/icons-material/Image";
import DataObjectIcon from "@mui/icons-material/DataObject";
import {
  Box,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  type SelectChangeEvent,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { buildPostEditorExtensions } from "./extensions";
import "./tiptapArticle.css";

const CODE_LANGS = [
  { value: "javascript", label: "JavaScript" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "bash", label: "Bash" },
] as const;

export type PostTiptapEditorProps = {
  value: JSONContent;
  onChange: (doc: JSONContent) => void;
  disabled?: boolean;
  uploadImage: (file: File) => Promise<string>;
};

export function PostTiptapEditor({ value, onChange, disabled, uploadImage }: PostTiptapEditorProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: buildPostEditorExtensions({ placeholder: "Write with headings, lists, links, images, and code blocks…" }),
    content: value,
    editable: !disabled,
    editorProps: {
      attributes: {
        class: "ProseMirror",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON());
    },
    shouldRerenderOnTransaction: true,
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    const cur = JSON.stringify(editor.getJSON());
    const next = JSON.stringify(value);
    if (cur !== next) {
      editor.commands.setContent(value, false);
    }
  }, [editor, value]);

  const headingValue = (() => {
    if (!editor) return "paragraph";
    for (let level = 1; level <= 4; level += 1) {
      if (editor.isActive("heading", { level })) return `h${level}`;
    }
    return "paragraph";
  })();

  const onHeadingChange = (e: SelectChangeEvent<string>) => {
    if (!editor) return;
    const v = e.target.value;
    if (v === "paragraph") {
      editor.chain().focus().setParagraph().run();
    } else {
      const level = Number(v.replace("h", "")) as 1 | 2 | 3 | 4;
      editor.chain().focus().setHeading({ level }).run();
    }
  };

  const codeLangValue = (() => {
    if (!editor?.isActive("codeBlock")) return "javascript";
    const lang = editor.getAttributes("codeBlock").language as string | undefined;
    return CODE_LANGS.some((c) => c.value === lang) ? lang! : "javascript";
  })();

  const onCodeLangChange = (e: SelectChangeEvent<string>) => {
    if (!editor) return;
    const lang = e.target.value;
    editor.chain().focus().updateAttributes("codeBlock", { language: lang }).run();
  };

  const onImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setUploading(false);
    }
  };

  if (!editor) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Loading editor…
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="tiptap-article">
      <Paper
        variant="outlined"
        sx={{
          mb: 1,
          px: 1,
          py: 0.75,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.75,
          bgcolor: "background.paper",
          borderRadius: 1,
        }}
      >
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="post-hd-label">Block</InputLabel>
          <Select labelId="post-hd-label" label="Block" value={headingValue} onChange={onHeadingChange} disabled={disabled}>
            <MenuItem value="paragraph">Paragraph</MenuItem>
            <MenuItem value="h1">Heading 1</MenuItem>
            <MenuItem value="h2">Heading 2</MenuItem>
            <MenuItem value="h3">Heading 3</MenuItem>
            <MenuItem value="h4">Heading 4</MenuItem>
          </Select>
        </FormControl>

        <ToggleButtonGroup size="small" sx={{ flexWrap: "wrap" }}>
          <ToggleButton
            value="bold"
            selected={editor.isActive("bold")}
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => {
              editor.chain().focus().toggleBold().run();
            }}
            disabled={disabled}
            aria-label="Bold"
          >
            <FormatBoldIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="italic"
            selected={editor.isActive("italic")}
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => {
              editor.chain().focus().toggleItalic().run();
            }}
            disabled={disabled}
            aria-label="Italic"
          >
            <FormatItalicIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="underline"
            selected={editor.isActive("underline")}
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => {
              editor.chain().focus().toggleUnderline().run();
            }}
            disabled={disabled}
            aria-label="Underline"
          >
            <FormatUnderlinedIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="code"
            selected={editor.isActive("code")}
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => {
              editor.chain().focus().toggleCode().run();
            }}
            disabled={disabled}
            aria-label="Inline code"
          >
            <CodeIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>

        <Divider flexItem orientation="vertical" sx={{ mx: 0.25, display: { xs: "none", sm: "block" } }} />

        <ToggleButtonGroup size="small" sx={{ flexWrap: "wrap" }}>
          <ToggleButton
            value="bullet"
            selected={editor.isActive("bulletList")}
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            aria-label="Bullet list"
          >
            <FormatListBulletedIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="ordered"
            selected={editor.isActive("orderedList")}
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            aria-label="Numbered list"
          >
            <FormatListNumberedIcon fontSize="small" />
          </ToggleButton>
          <ToggleButton
            value="quote"
            selected={editor.isActive("blockquote")}
            onMouseDown={(ev) => ev.preventDefault()}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={disabled}
            aria-label="Blockquote"
          >
            <FormatQuoteIcon fontSize="small" />
          </ToggleButton>
        </ToggleButtonGroup>

        <IconButton
          size="small"
          color={editor.isActive("codeBlock") ? "primary" : "default"}
          onMouseDown={(ev) => ev.preventDefault()}
          onClick={() => editor.chain().focus().toggleCodeBlock({ language: "javascript" }).run()}
          disabled={disabled}
          aria-label="Code block"
        >
          <DataObjectIcon fontSize="small" />
        </IconButton>

        {editor.isActive("codeBlock") && (
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="code-lang-label">Syntax</InputLabel>
            <Select
              labelId="code-lang-label"
              label="Syntax"
              value={codeLangValue}
              onChange={onCodeLangChange}
              disabled={disabled}
            >
              {CODE_LANGS.map((o) => (
                <MenuItem key={o.value} value={o.value}>
                  {o.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <IconButton
          size="small"
          color={editor.isActive("link") ? "primary" : "default"}
          onMouseDown={(ev) => ev.preventDefault()}
          onClick={() => {
            const prev = editor.getAttributes("link").href as string | undefined;
            const href = window.prompt("Link URL (https://…)", prev ?? "https://");
            if (href === null) return;
            const trimmed = href.trim();
            if (!trimmed) {
              editor.chain().focus().extendMarkRange("link").unsetLink().run();
              return;
            }
            editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
          }}
          disabled={disabled}
          aria-label="Link"
        >
          <LinkIcon fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          onMouseDown={(ev) => ev.preventDefault()}
          onClick={() => fileRef.current?.click()}
          disabled={disabled || uploading}
          aria-label="Insert image"
        >
          <ImageIcon fontSize="small" />
        </IconButton>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void onImagePick(e)} />
      </Paper>

      <Paper
        variant="outlined"
        sx={{
          borderRadius: 1,
          px: 1.5,
          py: 1,
          bgcolor: "background.paper",
          borderColor: "divider",
          "& .ProseMirror": { minHeight: 320 },
        }}
      >
        <EditorContent editor={editor} />
      </Paper>
    </Box>
  );
}
