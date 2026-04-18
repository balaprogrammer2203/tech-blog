import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { clearAuth, setAccessToken } from "./authSlice";
import type { User } from "./authSlice";
import type { AdminCategoryDetail, AdminCategoryRow, CategoriesTreeResponse, PostCategory } from "@/types/categories";

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

export type Paginated<T> = { items: T[]; page: number; limit: number; total: number; totalPages: number };

export type AdminDashboardResponse = {
  generatedAt: string;
  posts: { total: number; published: number; draft: number; publishedLast7Days: number };
  users: { total: number; admins: number };
  comments: { total: number };
  reports: { total: number; pending: number; resolved: number; dismissed: number };
  categories: { roots: number; children: number; total: number };
  engagement: { totalLikes: number };
  recentPosts: Array<{
    id: string;
    title: string;
    slug: string;
    status: string;
    updatedAt: string;
    publishedAt: string | null;
    likeCount: number;
    commentCount: number;
    author: { name: string; email: string } | null;
  }>;
  pendingReports: Array<{
    id: string;
    targetType: string;
    targetId: string;
    reason: string;
    createdAt: string;
    reporter: { name: string; email: string } | null;
  }>;
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["AdminPosts", "AdminUsers", "AdminReports", "Categories", "AdminCategories", "AdminDashboard"],
  endpoints: (build) => ({
    getMe: build.query<{ user: User | null }, void>({
      query: () => "/api/auth/me",
    }),
    adminDashboard: build.query<AdminDashboardResponse, void>({
      query: () => "/api/admin/dashboard",
      providesTags: ["AdminDashboard"],
    }),
    login: build.mutation<{ accessToken: string; user: User }, { email: string; password: string }>({
      query: (body) => ({ url: "/api/auth/login", method: "POST", body }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: "/api/auth/logout", method: "POST" }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch {
          /* ignore */
        } finally {
          dispatch(clearAuth());
        }
      },
    }),
    categoriesTree: build.query<CategoriesTreeResponse, void>({
      query: () => "/api/categories",
      providesTags: ["Categories"],
    }),
    adminCategoryList: build.query<
      Paginated<AdminCategoryRow>,
      {
        page: number;
        limit: number;
        q?: string;
        level?: "all" | "root" | "child";
        parentId?: string;
        sortField: "name" | "slug" | "sortOrder" | "createdAt" | "postCount";
        sortOrder: "asc" | "desc";
      }
    >({
      query: ({ page, limit, q, level, parentId, sortField, sortOrder }) => ({
        url: "/api/admin/categories",
        params: {
          page,
          limit,
          sortField,
          sortOrder,
          ...(q ? { q } : {}),
          ...(level && level !== "all" ? { level } : {}),
          ...(parentId ? { parentId } : {}),
        },
      }),
      providesTags: ["AdminCategories"],
    }),
    adminCategoryDetail: build.query<AdminCategoryDetail, string>({
      query: (id) => `/api/admin/categories/${id}`,
      providesTags: (_r, _e, id) => [{ type: "AdminCategories", id }],
    }),
    createAdminCategory: build.mutation<
      { id: string; slug: string },
      { name: string; slug?: string; parentId?: string | null; description?: string; sortOrder?: number }
    >({
      query: (body) => ({ url: "/api/admin/categories", method: "POST", body }),
      invalidatesTags: ["AdminCategories", "Categories", "AdminDashboard"],
    }),
    updateAdminCategory: build.mutation<
      { id: string; slug: string },
      {
        id: string;
        body: Partial<{
          name: string;
          slug: string;
          parentId: string | null;
          description: string;
          sortOrder: number;
        }>;
      }
    >({
      query: ({ id, body }) => ({ url: `/api/admin/categories/${id}`, method: "PATCH", body }),
      invalidatesTags: (_r, _e, { id }) => ["AdminCategories", "Categories", "AdminDashboard", { type: "AdminCategories", id }],
    }),
    deleteAdminCategory: build.mutation<void, string>({
      query: (id) => ({ url: `/api/admin/categories/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdminCategories", "Categories", "AdminDashboard"],
    }),
    adminPosts: build.query<
      Paginated<{
        id: string;
        title: string;
        slug: string;
        excerpt: string;
        status: string;
        publishedAt?: string;
        updatedAt?: string;
        likeCount: number;
        commentCount: number;
        author: { id: string; email: string; name: string } | null;
        category: PostCategory;
      }>,
      { page: number; status?: string; category?: string; categorySlug?: string }
    >({
      query: ({ page, status, category, categorySlug }) => ({
        url: "/api/admin/users/posts",
        params: {
          page,
          limit: 20,
          ...(status ? { status } : {}),
          ...(category ? { category } : {}),
          ...(categorySlug ? { categorySlug } : {}),
        },
      }),
      providesTags: ["AdminPosts"],
    }),
    setPostStatus: build.mutation<void, { id: string; status: "draft" | "published" }>({
      query: ({ id, status }) => ({
        url: `/api/admin/users/posts/${id}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["AdminPosts", "AdminDashboard"],
    }),
    deletePost: build.mutation<void, string>({
      query: (id) => ({ url: `/api/admin/users/posts/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdminPosts", "AdminDashboard"],
    }),
    adminUsers: build.query<
      Paginated<{ id: string; email: string; name: string; role: string; createdAt: string }>,
      { page: number; q?: string }
    >({
      query: ({ page, q }) => ({
        url: "/api/admin/users",
        params: { page, limit: 20, ...(q ? { q } : {}) },
      }),
      providesTags: ["AdminUsers"],
    }),
    setUserRole: build.mutation<void, { id: string; role: "user" | "admin" }>({
      query: ({ id, role }) => ({
        url: `/api/admin/users/${id}/role`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["AdminUsers", "AdminDashboard"],
    }),
    deleteUser: build.mutation<void, string>({
      query: (id) => ({ url: `/api/admin/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["AdminUsers", "AdminPosts", "AdminDashboard"],
    }),
    adminReports: build.query<
      Paginated<{
        id: string;
        targetType: string;
        targetId: string;
        reason: string;
        status: string;
        createdAt: string;
        reporter: { id: string; name: string; email: string } | null;
      }>,
      { page: number; status?: string }
    >({
      query: ({ page, status }) => ({
        url: "/api/reports/admin",
        params: { page, limit: 20, ...(status ? { status } : {}) },
      }),
      providesTags: ["AdminReports"],
    }),
    setReportStatus: build.mutation<void, { id: string; status: "pending" | "resolved" | "dismissed" }>({
      query: ({ id, status }) => ({
        url: `/api/reports/admin/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["AdminReports", "AdminDashboard"],
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useAdminDashboardQuery,
  useCategoriesTreeQuery,
  useAdminCategoryListQuery,
  useAdminCategoryDetailQuery,
  useCreateAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
  useAdminPostsQuery,
  useSetPostStatusMutation,
  useDeletePostMutation,
  useAdminUsersQuery,
  useSetUserRoleMutation,
  useDeleteUserMutation,
  useAdminReportsQuery,
  useSetReportStatusMutation,
} = baseApi;
