import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreatePostMutation,
  useGetPostByIdQuery,
  useUpdatePostMutation,
  useUploadImageMutation,
} from "@/store/baseApi";
import { estimateReadMinutes } from "@/lib/readTime";

const MAX_TAGS = 5;

export function WritePage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetPostByIdQuery(postId ?? "", { skip: !postId });
  const [createPost, { isLoading: creating }] = useCreatePostMutation();
  const [updatePost, { isLoading: updating }] = useUpdatePostMutation();
  const [upload, { isLoading: uploading }] = useUploadImageMutation();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setExcerpt(data.excerpt);
    setContent(data.content);
    setTagsInput((data.tags ?? []).join(", "));
    setStatus((data.status as "draft" | "published") ?? "draft");
    setCoverImageUrl(data.coverImageUrl ?? "");
  }, [data]);

  const tags = useMemo(
    () =>
      tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, MAX_TAGS),
    [tagsInput]
  );

  const readTimeMinutes = useMemo(() => estimateReadMinutes(content), [content]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title,
      excerpt,
      content,
      tags,
      status,
      readTimeMinutes,
      ...(coverImageUrl ? { coverImageUrl } : {}),
    };
    if (postId && data) {
      const res = await updatePost({ id: postId, body: payload }).unwrap();
      navigate(`/p/${res.slug}`);
      return;
    }
    const res = await createPost(payload).unwrap();
    navigate(`/p/${res.slug}`);
  }

  async function onCoverFile(file: File | null) {
    if (!file) return;
    try {
      const res = await upload(file).unwrap();
      setCoverImageUrl(res.url);
    } catch {
      window.alert("Upload failed. Is Cloudinary configured on the API?");
    }
  }

  if (postId && isLoading) return <p className="text-sm text-ink-muted">Loading draft…</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl font-semibold">{postId ? "Edit post" : "New post"}</h1>
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <div>
          <label className="text-sm text-ink-muted">Title</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm text-ink-muted">Excerpt</label>
          <textarea
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            rows={3}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="text-sm text-ink-muted">Markdown body</label>
          <textarea
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 font-mono text-sm dark:border-gray-700 dark:bg-gray-900"
            rows={16}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-ink-muted">Estimated read: {readTimeMinutes} min (sent with save)</p>
        </div>
        <div>
          <label className="text-sm text-ink-muted">Tags (comma-separated, max {MAX_TAGS})</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm text-ink-muted">Cover image</label>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <input type="file" accept="image/*" onChange={(e) => void onCoverFile(e.target.files?.[0] ?? null)} />
            {uploading && <span className="text-xs text-ink-muted">Uploading…</span>}
          </div>
          {coverImageUrl && <p className="mt-1 truncate text-xs text-ink-muted">{coverImageUrl}</p>}
        </div>
        <div>
          <label className="text-sm text-ink-muted">Status</label>
          <select
            className="mt-1 w-full rounded-md border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={status}
            onChange={(e) => setStatus(e.target.value as "draft" | "published")}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={creating || updating}
          className="rounded-md bg-ink px-4 py-2 text-sm text-white dark:bg-gray-100 dark:text-black"
        >
          {creating || updating ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
