import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { clearAuth, setAccessToken } from "./authSlice";
import type { Paginated, PostDetail, PostListItem, User } from "@/types";

type AuthSliceState = { auth: { accessToken: string | null } };

const rawBaseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as AuthSliceState).auth.accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError> = async (
  args,
  api,
  extraOptions
) => {
  let result = await rawBaseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    const refresh = await rawBaseQuery({ url: "/api/auth/refresh", method: "POST" }, api, extraOptions);
    if (refresh.data && typeof refresh.data === "object" && "accessToken" in refresh.data) {
      api.dispatch(setAccessToken(String((refresh.data as { accessToken: string }).accessToken)));
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      api.dispatch(clearAuth());
    }
  }
  return result;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Post", "PostDetail", "Comments", "Likes", "Bookmarks", "Me"],
  endpoints: (build) => ({
    getMe: build.query<{ user: User | null }, void>({
      query: () => "/api/auth/me",
      providesTags: ["Me"],
    }),
    login: build.mutation<{ accessToken: string; user: User }, { email: string; password: string }>({
      query: (body) => ({ url: "/api/auth/login", method: "POST", body }),
      invalidatesTags: ["Me", "Bookmarks"],
    }),
    register: build.mutation<{ accessToken: string; user: User }, { email: string; password: string; name: string }>({
      query: (body) => ({ url: "/api/auth/register", method: "POST", body }),
      invalidatesTags: ["Me", "Bookmarks"],
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/api/auth/logout", method: "POST" }),
      invalidatesTags: ["Me", "Bookmarks", "Likes"],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          /* still clear local session */
        } finally {
          dispatch(clearAuth());
        }
      },
    }),
    listPosts: build.query<Paginated<PostListItem>, { page: number; limit?: number; q?: string }>({
      query: ({ page, limit = 12, q }) => ({
        url: "/api/posts",
        params: { page, limit, ...(q ? { q } : {}) },
      }),
      keepUnusedDataFor: 120,
      providesTags: (res) =>
        res?.items?.length
          ? [...res.items.map((p) => ({ type: "Post" as const, id: p.id })), { type: "Post", id: "LIST" }]
          : [{ type: "Post", id: "LIST" }],
    }),
    getPostBySlug: build.query<PostDetail, string>({
      query: (slug) => `/api/posts/slug/${encodeURIComponent(slug)}`,
      keepUnusedDataFor: 300,
      providesTags: (res) => (res ? [{ type: "PostDetail", id: res.id }] : []),
    }),
    getPostById: build.query<PostDetail, string>({
      query: (id) => `/api/posts/${id}`,
      keepUnusedDataFor: 60,
      providesTags: (res) => (res ? [{ type: "PostDetail", id: res.id }] : []),
    }),
    getMyPosts: build.query<Paginated<PostListItem & { status: string; updatedAt?: string }>, { page: number }>({
      query: ({ page }) => ({ url: "/api/posts/mine", params: { page, limit: 20 } }),
      providesTags: [{ type: "Post", id: "MINE" }],
    }),
    createPost: build.mutation<{ id: string; slug: string }, Record<string, unknown>>({
      query: (body) => ({ url: "/api/posts", method: "POST", body }),
      invalidatesTags: [{ type: "Post", id: "LIST" }, { type: "Post", id: "MINE" }],
    }),
    updatePost: build.mutation<{ id: string; slug: string }, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/api/posts/${id}`, method: "PATCH", body }),
      invalidatesTags: (_res, _err, arg) => [
        { type: "Post", id: "LIST" },
        { type: "Post", id: "MINE" },
        { type: "PostDetail", id: arg.id },
      ],
    }),
    deletePost: build.mutation<void, string>({
      query: (id) => ({ url: `/api/posts/${id}`, method: "DELETE" }),
      invalidatesTags: [{ type: "Post", id: "LIST" }, { type: "Post", id: "MINE" }],
    }),
    listComments: build.query<
      Paginated<{
        id: string;
        body: string;
        depth: number;
        parentId: string | null;
        author: { id: string; name: string } | null;
        createdAt: string;
      }>,
      { postId: string; page: number }
    >({
      query: ({ postId, page }) => `/api/posts/${postId}/comments?page=${page}&limit=30`,
      providesTags: (_res, _err, arg) => [{ type: "Comments", id: arg.postId }],
    }),
    addComment: build.mutation<{ id: string }, { postId: string; body: string; parentId?: string }>({
      query: ({ postId, body, parentId }) => ({
        url: `/api/posts/${postId}/comments`,
        method: "POST",
        body: { body, ...(parentId ? { parentId } : {}) },
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: "Comments", id: arg.postId }, { type: "PostDetail", id: arg.postId }],
    }),
    deleteComment: build.mutation<void, { postId: string; commentId: string }>({
      query: ({ postId, commentId }) => ({
        url: `/api/posts/${postId}/comments/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, arg) => [{ type: "Comments", id: arg.postId }, { type: "PostDetail", id: arg.postId }],
    }),
    getLikeStatus: build.query<{ liked: boolean; likeCount: number }, string>({
      query: (postId) => `/api/posts/${postId}/likes`,
      providesTags: (_res, _err, postId) => [{ type: "Likes", id: postId }],
    }),
    toggleLike: build.mutation<{ liked: boolean; likeCount: number }, string>({
      query: (postId) => ({ url: `/api/posts/${postId}/likes/toggle`, method: "POST" }),
      invalidatesTags: (_res, _err, postId) => [{ type: "Likes", id: postId }, { type: "PostDetail", id: postId }],
    }),
    listBookmarks: build.query<
      Paginated<{ bookmarkedAt: string; post: Omit<PostListItem, "likeCount" | "commentCount" | "author" | "tags"> }>,
      { page: number }
    >({
      query: ({ page }) => ({ url: "/api/bookmarks", params: { page, limit: 20 } }),
      providesTags: ["Bookmarks"],
    }),
    getBookmarkStatus: build.query<{ bookmarked: boolean }, string>({
      query: (postId) => `/api/bookmarks/${postId}/status`,
      providesTags: (_res, _err, postId) => [{ type: "Bookmarks", id: postId }],
    }),
    toggleBookmark: build.mutation<{ bookmarked: boolean }, string>({
      query: (postId) => ({ url: `/api/bookmarks/${postId}/toggle`, method: "POST" }),
      invalidatesTags: (_res, _err, postId) => ["Bookmarks", { type: "Bookmarks", id: postId }, { type: "PostDetail", id: postId }],
    }),
    reportContent: build.mutation<void, { targetType: "post" | "comment"; targetId: string; reason: string }>({
      query: (body) => ({ url: "/api/reports", method: "POST", body }),
    }),
    uploadImage: build.mutation<{ url: string }, File>({
      query: (file) => {
        const form = new FormData();
        form.append("file", file);
        return { url: "/api/upload/image", method: "POST", body: form };
      },
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useListPostsQuery,
  useGetPostBySlugQuery,
  useGetPostByIdQuery,
  useGetMyPostsQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useDeletePostMutation,
  useListCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
  useGetLikeStatusQuery,
  useToggleLikeMutation,
  useListBookmarksQuery,
  useGetBookmarkStatusQuery,
  useToggleBookmarkMutation,
  useReportContentMutation,
  useUploadImageMutation,
} = baseApi;
