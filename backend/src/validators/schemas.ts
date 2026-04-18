import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(80),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(30).default(12),
});

/** Admin tables: larger page size */
export const adminListPaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const postCreateSchema = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(320),
  content: z.string().min(1).max(100_000),
  tags: z.array(z.string().trim().min(1).max(40)).max(5).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
  /** Leaf category (second level); required when status is published */
  categoryId: z.string().optional(),
  coverImageUrl: z.string().url().max(500).optional(),
  readTimeMinutes: z.number().int().min(1).max(999).optional(),
});

export const postUpdateSchema = postCreateSchema.partial();

export const commentCreateSchema = z.object({
  body: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export const reportCreateSchema = z.object({
  targetType: z.enum(["post", "comment"]),
  targetId: z.string().min(1),
  reason: z.string().min(1).max(500),
});

export const adminUserRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
});

/** Admin creates a user account (no auto-login; password sets credentials). */
export const adminUserCreateSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(80),
  role: z.enum(["user", "admin"]).default("user"),
});

export const adminCategoryListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  level: z.enum(["all", "root", "child"]).default("all"),
  parentId: z.string().optional(),
  sortField: z.enum(["name", "slug", "sortOrder", "createdAt", "postCount"]).default("sortOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const adminCategoryCreateSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(96).optional(),
  parentId: z.string().optional().nullable(),
  description: z.string().max(300).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const adminCategoryUpdateSchema = adminCategoryCreateSchema.partial();

/** Export specific categories by id (POST body). */
export const adminCategoryExportByIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
});

export const adminPostListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  categorySlug: z.string().optional(),
  sortField: z
    .enum(["title", "slug", "status", "updatedAt", "publishedAt", "createdAt", "likeCount", "commentCount"])
    .default("updatedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const adminUserListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  role: z.enum(["admin", "user"]).optional(),
  sortField: z.enum(["email", "name", "role", "createdAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const adminPostExportByIdsSchema = adminCategoryExportByIdsSchema;
export const adminUserExportByIdsSchema = adminCategoryExportByIdsSchema;

/** Admin creates a post; optional authorId assigns another user as author. */
export const adminPostCreateSchema = postCreateSchema.extend({
  authorId: z.string().optional(),
});
