import { z } from "zod";
import { assertValidTiptapContent, tiptapDocumentHasMeaningfulContent } from "./tiptapDoc.js";

const mongoObjectIdString = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");

export const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(72),
  name: z.string().min(1).max(80),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(72),
});

export const selfUpdateProfileSchema = z.object({
  name: z.string().min(1).max(80),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(8).max(72),
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

export const adminReportListQuerySchema = adminListPaginationSchema.extend({
  status: z.enum(["pending", "resolved", "dismissed"]).optional(),
  q: z.string().optional(),
  sortField: z
    .enum(["status", "targetType", "targetId", "reason", "createdAt", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/** Markdown string (legacy) or TipTap `{ type: \"doc\", ... }` JSON (validated). */
export const postContentFieldSchema = z.union([
  z.string().min(1).max(150_000),
  z.custom<unknown>((data) => {
    try {
      assertValidTiptapContent(data);
      return true;
    } catch {
      return false;
    }
  }, "Invalid TipTap document"),
]);

const postBodyFields = z.object({
  title: z.string().min(1).max(200),
  excerpt: z.string().min(1).max(320),
  content: postContentFieldSchema,
  /** Up to five Tag document ids (24-char hex). */
  tags: z.array(mongoObjectIdString).max(5).default([]),
  status: z.enum(["draft", "published"]).default("draft"),
  /** Leaf category (second level); required when status is published */
  categoryId: z.string().optional(),
  coverImageUrl: z.string().url().max(500).optional(),
  readTimeMinutes: z.number().int().min(1).max(999).optional(),
});

function refinePostContentNonEmpty(data: { content?: unknown }, ctx: z.RefinementCtx): void {
  if (data.content === undefined) return;
  if (typeof data.content === "string") {
    if (!data.content.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["content"], message: "Content cannot be empty" });
    }
  } else if (!tiptapDocumentHasMeaningfulContent(data.content)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["content"], message: "Content cannot be empty" });
  }
}

export const postCreateSchema = postBodyFields.superRefine((data, ctx) => refinePostContentNonEmpty(data, ctx));

export const postUpdateSchema = postBodyFields.partial().superRefine((data, ctx) => refinePostContentNonEmpty(data, ctx));

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

export const adminReportExportByIdsSchema = adminCategoryExportByIdsSchema;

export const adminPostListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  categorySlug: z.string().optional(),
  tagSlug: z.string().optional(),
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
export const adminPostCreateSchema = postBodyFields
  .extend({
    authorId: z.string().optional(),
  })
  .superRefine((data, ctx) => refinePostContentNonEmpty(data, ctx));

export const adminTagListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().optional(),
  sortField: z.enum(["name", "slug", "sortOrder", "createdAt", "postCount"]).default("sortOrder"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export const adminTagCreateSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(96).optional(),
  description: z.string().max(300).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const adminTagUpdateSchema = adminTagCreateSchema.partial();

export const adminTagExportByIdsSchema = adminCategoryExportByIdsSchema;
