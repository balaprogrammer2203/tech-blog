import { lazy, Suspense, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useAddCommentMutation,
  useDeleteCommentMutation,
  useGetBookmarkStatusQuery,
  useGetLikeStatusQuery,
  useGetPostBySlugQuery,
  useListCommentsQuery,
  useReportContentMutation,
  useToggleBookmarkMutation,
  useToggleLikeMutation,
} from "@/store/baseApi";
import { useAppSelector } from "@/store/hooks";
import type { JSONContent } from "@tiptap/core";
import { estimateReadMinutesFromPost } from "@/lib/readTime";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SplitPageLayout } from "@/components/SplitPageLayout";
import { categoryHref } from "@/lib/routes";

const PostTiptapArticle = lazy(async () => {
  const m = await import("@/lib/postTiptap/PostTiptapArticle");
  return { default: m.PostTiptapArticle };
});

function isTiptapDocContent(c: unknown): c is JSONContent {
  return typeof c === "object" && c !== null && !Array.isArray(c) && (c as { type?: string }).type === "doc";
}

export function ArticlePage() {
  const { slug = "" } = useParams();
  const user = useAppSelector((s) => s.auth.user);
  const { data: post, isLoading, isError, refetch } = useGetPostBySlugQuery(slug);
  const postId = post?.id ?? "";
  const { data: likes } = useGetLikeStatusQuery(postId, { skip: !postId });
  const { data: bm } = useGetBookmarkStatusQuery(postId, { skip: !postId || !user });
  const [toggleLike, { isLoading: likeBusy }] = useToggleLikeMutation();
  const [toggleBm, { isLoading: bmBusy }] = useToggleBookmarkMutation();
  const { data: comments, refetch: refetchComments } = useListCommentsQuery({ postId, page: 1 }, { skip: !postId });
  const [body, setBody] = useState("");
  const [parentId, setParentId] = useState<string | undefined>();
  const [addComment, { isLoading: adding }] = useAddCommentMutation();
  const [removeComment] = useDeleteCommentMutation();
  const [report, { isLoading: reporting }] = useReportContentMutation();
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const clientRead = useMemo(() => (post ? estimateReadMinutesFromPost(post.content) : 0), [post]);

  if (isLoading) {
    return (
      <SplitPageLayout>
        <p className="text-sm text-ink-muted">Loading article…</p>
      </SplitPageLayout>
    );
  }
  if (isError || !post) {
    return (
      <SplitPageLayout>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900/40 dark:bg-amber-950/40">
          Article not available.{" "}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Retry
          </button>
        </div>
      </SplitPageLayout>
    );
  }

  async function submitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    await addComment({ postId, body, parentId }).unwrap();
    setBody("");
    setParentId(undefined);
    void refetchComments();
  }

  const crumbs =
    post.category != null
      ? [
          { label: "Home", to: "/" },
          { label: post.category.parent.name },
          {
            label: post.category.name,
            to: categoryHref(post.category.parent.slug, post.category.slug),
          },
          { label: post.title },
        ]
      : [{ label: "Home", to: "/" }, { label: post.title }];

  return (
    <SplitPageLayout>
      <article className="mx-auto max-w-3xl space-y-8">
      <Breadcrumbs items={crumbs} />
      <header className="space-y-3">
        <h1 className="font-serif text-4xl font-semibold leading-tight text-ink dark:text-gray-50">{post.title}</h1>
        <div className="flex flex-wrap gap-3 text-sm text-ink-muted">
          {post.author?.name && <span>{post.author.name}</span>}
          <span>{post.readTimeMinutes ?? clientRead} min read</span>
          {post.publishedAt && <span>{new Date(post.publishedAt).toLocaleDateString()}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          {post.tags?.map((t) => (
            <span key={t.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
              {t.name}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!user || likeBusy || !postId}
            className="rounded-full border border-gray-200 px-3 py-1 text-sm disabled:opacity-40 dark:border-gray-700"
            onClick={() => postId && void toggleLike(postId)}
          >
            {likes?.liked ? "Unlike" : "Like"} ({likes?.likeCount ?? post.likeCount})
          </button>
          {user && (
            <button
              type="button"
              disabled={bmBusy || !postId}
              className="rounded-full border border-gray-200 px-3 py-1 text-sm dark:border-gray-700"
              onClick={() => postId && void toggleBm(postId)}
            >
              {bm?.bookmarked ? "Remove bookmark" : "Bookmark"}
            </button>
          )}
          {user && (
            <>
              <button type="button" className="text-sm underline" onClick={() => setReportOpen(true)}>
                Report
              </button>
            </>
          )}
        </div>
      </header>
      {post.coverImageUrl && (
        <img src={post.coverImageUrl} alt="" className="w-full rounded-lg object-cover" loading="lazy" />
      )}
      {isTiptapDocContent(post.content) ? (
        <Suspense fallback={<p className="text-sm text-ink-muted">Loading article body…</p>}>
          <PostTiptapArticle doc={post.content} />
        </Suspense>
      ) : (
        <div className="prose prose-neutral max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{String(post.content)}</ReactMarkdown>
        </div>
      )}
      <section className="border-t border-gray-100 pt-8 dark:border-gray-800">
        <h2 className="font-serif text-2xl font-semibold">Comments</h2>
        {user ? (
          <form className="mt-4 space-y-2" onSubmit={(e) => void submitComment(e)}>
            {parentId && (
              <p className="text-xs text-ink-muted">
                Replying…{" "}
                <button type="button" className="underline" onClick={() => setParentId(undefined)}>
                  cancel
                </button>
              </p>
            )}
            <textarea
              className="w-full rounded-md border border-gray-200 p-2 text-sm dark:border-gray-700 dark:bg-gray-900"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Share a thoughtful comment"
            />
            <button
              type="submit"
              disabled={adding}
              className="rounded-md bg-ink px-4 py-2 text-sm text-white dark:bg-gray-100 dark:text-black"
            >
              {adding ? "Posting…" : "Post comment"}
            </button>
          </form>
        ) : (
          <p className="mt-4 text-sm text-ink-muted">
            <Link className="underline" to="/login">
              Sign in
            </Link>{" "}
            to comment.
          </p>
        )}
        <ul className="mt-6 space-y-4">
          {comments?.items.map((c) => (
            <li key={c.id} className="rounded-md border border-gray-100 p-3 text-sm dark:border-gray-800">
              <div className="flex justify-between gap-2">
                <p className="font-medium">{c.author?.name ?? "Member"}</p>
                <span className="text-xs text-ink-muted">{new Date(c.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap">{c.body}</p>
              <div className="mt-2 flex gap-3 text-xs">
                {user && c.depth < 2 && (
                  <button type="button" className="underline" onClick={() => setParentId(c.id)}>
                    Reply
                  </button>
                )}
                {user && (c.author?.id === user.id || user.role === "admin") && (
                  <button
                    type="button"
                    className="text-red-600 underline dark:text-red-400"
                    onClick={() => void removeComment({ postId, commentId: c.id })}
                  >
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
      {reportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg dark:bg-gray-900">
            <h3 className="font-medium">Report article</h3>
            <textarea
              className="mt-2 w-full rounded border border-gray-200 p-2 text-sm dark:border-gray-700"
              rows={3}
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" className="text-sm" onClick={() => setReportOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                disabled={reporting || !reportReason.trim()}
                className="rounded bg-ink px-3 py-1 text-sm text-white dark:bg-gray-100 dark:text-black"
                onClick={async () => {
                  await report({ targetType: "post", targetId: post.id, reason: reportReason }).unwrap();
                  setReportOpen(false);
                  setReportReason("");
                }}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
    </SplitPageLayout>
  );
}
