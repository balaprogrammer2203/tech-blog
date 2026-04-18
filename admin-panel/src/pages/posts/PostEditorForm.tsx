import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { JSONContent } from "@tiptap/core";
import { useSelector } from "react-redux";
import {
  useAdminPostDetailQuery,
  useAdminUsersQuery,
  useCategoriesTreeQuery,
  useCreateAdminPostMutation,
  usePublicTagsQuery,
  useUpdateAdminPostMutation,
} from "@/store/baseApi";
import type { PostTag } from "@/types/tags";
import type { RootState } from "@/store/store";
import type { CategoryChild } from "@/types/categories";
import { apiErrorMessage } from "../categories/apiErrorMessage";
import {
  EMPTY_POST_DOC,
  normalizePostContent,
  tiptapDocumentHasMeaningfulContent,
} from "@/lib/markdownToTiptapDoc";
import { uploadPostImage } from "@/lib/uploadPostImage";

const PostTiptapEditor = lazy(async () => {
  const m = await import("@/lib/postTiptap/PostTiptapEditor");
  return { default: m.PostTiptapEditor };
});

function flattenLeaves(roots: { children: CategoryChild[] }[] | undefined): { id: string; label: string }[] {
  if (!roots) return [];
  const out: { id: string; label: string }[] = [];
  for (const r of roots) {
    for (const ch of r.children) {
      const parentName = ch.parent?.name ?? "—";
      out.push({ id: ch.id, label: `${parentName} › ${ch.name}` });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

type Props =
  | { mode: "create"; onCancel: () => void; onSaved: (newId: string) => void }
  | { mode: "edit"; postId: string; onCancel: () => void; onSaved: () => void };

export function PostEditorForm(props: Props) {
  const postId = props.mode === "edit" ? props.postId : "";
  const { data: detail, isFetching } = useAdminPostDetailQuery(postId, { skip: props.mode !== "edit" || !postId });
  const { data: tree } = useCategoriesTreeQuery();
  const leaves = useMemo(() => flattenLeaves(tree?.roots), [tree?.roots]);
  const { data: usersPage } = useAdminUsersQuery(
    { page: 1, limit: 100, sortField: "email", sortOrder: "asc" },
    { skip: props.mode !== "create" }
  );
  const token = useSelector((s: RootState) => s.auth.accessToken);
  const apiBase = import.meta.env.VITE_API_URL as string;

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [contentDoc, setContentDoc] = useState<JSONContent>(EMPTY_POST_DOC);
  const [selectedTags, setSelectedTags] = useState<PostTag[]>([]);
  const { data: tagsData } = usePublicTagsQuery();
  const catalogTags = tagsData?.items ?? [];
  const tagOptions = useMemo(() => {
    const byId = new Map(catalogTags.map((t) => [t.id, t]));
    for (const s of selectedTags) {
      if (!byId.has(s.id)) byId.set(s.id, s);
    }
    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [catalogTags, selectedTags]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [categoryId, setCategoryId] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [readTimeMinutes, setReadTimeMinutes] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [createPost, { isLoading: creating }] = useCreateAdminPostMutation();
  const [updatePost, { isLoading: updating }] = useUpdateAdminPostMutation();

  const uploadImage = useCallback(
    (file: File) => uploadPostImage({ apiBaseUrl: apiBase, token, file }),
    [apiBase, token]
  );

  useEffect(() => {
    setFormError(null);
    if (props.mode === "create") {
      setTitle("");
      setExcerpt("");
      setContentDoc(EMPTY_POST_DOC);
      setSelectedTags([]);
      setStatus("draft");
      setCategoryId("");
      setCoverImageUrl("");
      setReadTimeMinutes("");
      setAuthorId("");
      return;
    }
    if (!detail) return;
    setTitle(detail.title);
    setExcerpt(detail.excerpt);
    setContentDoc(normalizePostContent(detail.content));
    setSelectedTags(detail.tags ?? []);
    setStatus(detail.status as "draft" | "published");
    setCategoryId(detail.category?.id ?? "");
    setCoverImageUrl(detail.coverImageUrl ?? "");
    setReadTimeMinutes(detail.readTimeMinutes != null ? String(detail.readTimeMinutes) : "");
  }, [props.mode, detail]);

  const saving = creating || updating;

  async function handleSubmit() {
    setFormError(null);
    if (status === "published" && !categoryId) {
      setFormError("Select a leaf category before publishing.");
      return;
    }
    if (!tiptapDocumentHasMeaningfulContent(contentDoc)) {
      setFormError("Add some body content (text, code, or an image) before saving.");
      return;
    }
    const tagIds = selectedTags.map((t) => t.id).slice(0, 5);
    try {
      if (props.mode === "create") {
        const res = await createPost({
          title,
          excerpt,
          content: contentDoc,
          tags: tagIds,
          status,
          categoryId: categoryId || undefined,
          coverImageUrl: coverImageUrl.trim() || undefined,
          readTimeMinutes: readTimeMinutes.trim() ? Number(readTimeMinutes) : undefined,
          authorId: authorId.trim() || undefined,
        }).unwrap();
        props.onSaved(res.id);
      } else {
        await updatePost({
          id: postId,
          body: {
            title,
            excerpt,
            content: contentDoc,
            tags: tagIds,
            status,
            categoryId: categoryId || "",
            coverImageUrl: coverImageUrl.trim() || undefined,
            readTimeMinutes: readTimeMinutes.trim() ? Number(readTimeMinutes) : undefined,
          },
        }).unwrap();
        props.onSaved();
      }
    } catch (e) {
      setFormError(apiErrorMessage(e, "Save failed."));
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900, width: "100%", borderRadius: 2 }}>
      {props.mode === "edit" && isFetching && !detail && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Loading post…
        </Typography>
      )}
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}
      <Stack spacing={2}>
        <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required fullWidth />
        <TextField label="Excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} required fullWidth multiline minRows={2} />
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.75 }}>
            Content
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Rich text with headings, lists, links, images (upload to Cloudinary when configured), and highlighted code blocks.
          </Typography>
          <Suspense
            fallback={
              <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
                <CircularProgress size={28} />
              </Box>
            }
          >
            <PostTiptapEditor
              value={contentDoc}
              onChange={setContentDoc}
              disabled={saving || (props.mode === "edit" && isFetching && !detail)}
              uploadImage={uploadImage}
            />
          </Suspense>
        </Box>
        <Autocomplete
          multiple
          options={tagOptions}
          getOptionLabel={(o) => o.name}
          value={selectedTags}
          onChange={(_, v) => setSelectedTags(v.slice(0, 5))}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip {...getTagProps({ index })} key={option.id} size="small" label={option.name} />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Tags"
              helperText="Pick up to five tags from the catalog. Each choice saves the tag id plus its current name on the post (updated if you rename the tag later)."
            />
          )}
        />
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as "draft" | "published")}>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="published">Published</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Leaf category</InputLabel>
            <Select label="Leaf category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {leaves.map((l) => (
                <MenuItem key={l.id} value={l.id}>
                  {l.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        {props.mode === "create" && (
          <FormControl fullWidth>
            <InputLabel>Author</InputLabel>
            <Select label="Author" value={authorId} onChange={(e) => setAuthorId(e.target.value)}>
              <MenuItem value="">
                <em>Me (signed-in admin)</em>
              </MenuItem>
              {(usersPage?.items ?? []).map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.email} · {u.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            label="Cover image URL (optional)"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            fullWidth
          />
          <TextField
            label="Read time (minutes, optional)"
            value={readTimeMinutes}
            onChange={(e) => setReadTimeMinutes(e.target.value)}
            type="number"
            inputProps={{ min: 1, max: 999 }}
            fullWidth
          />
        </Stack>
        <Stack
          direction={{ xs: "column-reverse", sm: "row" }}
          spacing={2}
          justifyContent="flex-end"
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Button onClick={props.onCancel} disabled={saving} sx={{ width: { xs: "100%", sm: "auto" } }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={saving || (props.mode === "edit" && isFetching && !detail)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
