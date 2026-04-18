import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCreatePostMutation,
  useGetPostByIdQuery,
  usePublicTagsQuery,
  useUpdatePostMutation,
  useUploadImageMutation,
} from "@/store/baseApi";
import { estimateReadMinutes, estimateReadMinutesFromPost } from "@/lib/readTime";

const MAX_TAGS = 5;

export function WritePage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetPostByIdQuery(postId ?? "", { skip: !postId });
  const { data: tagCatalog } = usePublicTagsQuery();
  const [createPost, { isLoading: creating }] = useCreatePostMutation();
  const [updatePost, { isLoading: updating }] = useUpdatePostMutation();
  const [upload, { isLoading: uploading }] = useUploadImageMutation();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setExcerpt(data.excerpt);
    setContent(typeof data.content === "string" ? data.content : JSON.stringify(data.content, null, 2));
    setSelectedTagIds((data.tags ?? []).map((t) => t.id));
    setStatus((data.status as "draft" | "published") ?? "draft");
    setCoverImageUrl(data.coverImageUrl ?? "");
  }, [data]);

  const tagOptions = useMemo(() => tagCatalog?.items ?? [], [tagCatalog?.items]);

  const readTimeMinutes = useMemo(() => {
    const trimmed = content.trim();
    if (trimmed.startsWith("{")) {
      try {
        return estimateReadMinutesFromPost(JSON.parse(trimmed) as unknown);
      } catch {
        /* ignore */
      }
    }
    return estimateReadMinutes(content);
  }, [content]);

  function parseBodyContent(raw: string): string | Record<string, unknown> {
    const trimmed = raw.trim();
    if (trimmed.startsWith("{")) {
      try {
        const o = JSON.parse(trimmed) as unknown;
        if (o && typeof o === "object" && !Array.isArray(o) && (o as { type?: string }).type === "doc") {
          return o as Record<string, unknown>;
        }
      } catch {
        /* fall through */
      }
    }
    return raw;
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_TAGS) return prev;
      return [...prev, id];
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      title,
      excerpt,
      content: parseBodyContent(content),
      tags: selectedTagIds,
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
          <label className="text-sm text-ink-muted">Tags (from catalog, max {MAX_TAGS})</label>
          <p className="mt-1 text-xs text-ink-muted">Admins maintain the tag list; pick any combination up to five.</p>
          <div className="mt-2 flex max-h-48 flex-col gap-2 overflow-y-auto rounded-md border border-gray-200 p-2 dark:border-gray-700">
            {tagOptions.length === 0 && <span className="text-xs text-ink-muted">No tags available yet.</span>}
            {tagOptions.map((t) => (
              <label key={t.id} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(t.id)}
                  onChange={() => toggleTag(t.id)}
                  disabled={!selectedTagIds.includes(t.id) && selectedTagIds.length >= MAX_TAGS}
                />
                <span>{t.name}</span>
                <span className="text-xs text-ink-muted">({t.slug})</span>
              </label>
            ))}
          </div>
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
