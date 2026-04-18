import { Router, type Response } from "express";
import mongoose from "mongoose";
import type { Env } from "../config/env.js";
import { User } from "../models/User.js";
import { Post } from "../models/Post.js";
import { Comment } from "../models/Comment.js";
import { Like } from "../models/Like.js";
import { Bookmark } from "../models/Bookmark.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { authMiddleware, requireAdmin, type AuthedRequest } from "../middleware/auth.js";
import { hashPassword } from "../utils/password.js";
import {
  adminPostCreateSchema,
  adminPostExportByIdsSchema,
  adminPostListQuerySchema,
  adminUserCreateSchema,
  adminUserExportByIdsSchema,
  adminUserListQuerySchema,
  adminUserRoleSchema,
  postUpdateSchema,
} from "../validators/schemas.js";
import { formatPostCategory, requireLeafCategoryId, resolveCategoryFilter } from "../utils/category.js";
import { formatPostTags, resolvePostTagEmbeddings, resolveTagSlugFilter } from "../utils/tag.js";
import { slugify } from "../utils/slug.js";
import { delCachePrefix } from "../lib/ttlCache.js";

const categoryPopulate = {
  path: "category" as const,
  select: "name slug parent",
  populate: { path: "parent", select: "name slug" },
};

function csvEscape(val: string | number | undefined | null): string {
  const s = val === undefined || val === null ? "" : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function uniqueObjectIdsFromStrings(ids: string[]): mongoose.Types.ObjectId[] {
  const seen = new Set<string>();
  const out: mongoose.Types.ObjectId[] = [];
  for (const id of ids) {
    if (!mongoose.isValidObjectId(id)) continue;
    const s = String(id);
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(new mongoose.Types.ObjectId(s));
  }
  return out;
}

function buildUserMatch(q: string | undefined, role: "admin" | "user" | undefined): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  const trimmed = q?.trim();
  if (trimmed) {
    const re = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ email: re }, { name: re }];
  }
  return filter;
}

async function uniquePostSlug(base: string): Promise<string> {
  let slug = slugify(base).slice(0, 220) || "post";
  for (let i = 0; i < 8; i++) {
    const exists = await Post.exists({ slug });
    if (!exists) return slug;
    slug = `${slugify(base).slice(0, 180)}-${Math.random().toString(36).slice(2, 6)}`.slice(0, 220);
  }
  return `${slugify(base).slice(0, 160)}-${Date.now().toString(36)}`.slice(0, 220);
}

async function sendUsersCsv(res: Response, filename: string, match: Record<string, unknown>, rowLimit: number): Promise<void> {
  const rows = await User.find(match)
    .sort({ createdAt: -1 })
    .limit(rowLimit)
    .select("email name role createdAt")
    .lean();
  const header = ["id", "email", "name", "role", "createdAt"];
  const lines = [
    header.join(","),
    ...rows.map((u) =>
      [
        csvEscape(String(u._id)),
        csvEscape(u.email),
        csvEscape(u.name),
        csvEscape(u.role),
        csvEscape(u.createdAt?.toISOString?.() ?? ""),
      ].join(",")
    ),
  ];
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(lines.join("\n"));
}

async function sendPostsCsv(res: Response, filename: string, match: Record<string, unknown>, rowLimit: number): Promise<void> {
  const rows = await Post.find(match)
    .sort({ updatedAt: -1 })
    .limit(rowLimit)
    .populate("author", "email name")
    .populate(categoryPopulate)
    .select("title slug excerpt status publishedAt updatedAt likeCount commentCount author category")
    .lean();
  const header = ["id", "title", "slug", "status", "authorEmail", "categoryPath", "likeCount", "commentCount", "publishedAt", "updatedAt", "excerpt"];
  const lines = [
    header.join(","),
    ...rows.map((p) => {
      const author =
        p.author && typeof p.author === "object"
          ? (p.author as unknown as { email?: string }).email ?? ""
          : "";
      const cat = formatPostCategory(p.category);
      const catPath = cat ? `${cat.parent.name} › ${cat.name}` : "";
      return [
        csvEscape(String(p._id)),
        csvEscape(p.title),
        csvEscape(p.slug),
        csvEscape(p.status),
        csvEscape(author),
        csvEscape(catPath),
        csvEscape(p.likeCount),
        csvEscape(p.commentCount),
        csvEscape(p.publishedAt ? new Date(p.publishedAt).toISOString() : ""),
        csvEscape(p.updatedAt ? new Date(p.updatedAt).toISOString() : ""),
        csvEscape(p.excerpt),
      ].join(",");
    }),
  ];
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(lines.join("\n"));
}

export function createAdminUsersRouter(env: Env) {
  const router = Router();
  const admin = [authMiddleware(env), requireAdmin];

  router.get(
    "/export",
    ...admin,
    asyncHandler(async (req, res) => {
      const raw = adminUserListQuerySchema.partial().parse(req.query);
      const match = buildUserMatch(raw.q, raw.role);
      await sendUsersCsv(res, "users.csv", match, 5000);
    })
  );

  router.post(
    "/export",
    ...admin,
    asyncHandler(async (req, res) => {
      const { ids } = adminUserExportByIdsSchema.parse(req.body);
      const oids = uniqueObjectIdsFromStrings(ids);
      if (!oids.length) throw new HttpError(400, "No valid user ids");
      await sendUsersCsv(res, "users-selected.csv", { _id: { $in: oids } }, oids.length);
    })
  );

  router.get(
    "/posts/export",
    ...admin,
    asyncHandler(async (req, res) => {
      const raw = adminPostListQuerySchema.partial().parse(req.query);
      const match = await buildPostListMatch(raw.q, raw.status, raw.categorySlug, raw.tagSlug);
      await sendPostsCsv(res, "posts.csv", match, 5000);
    })
  );

  router.post(
    "/posts/export",
    ...admin,
    asyncHandler(async (req, res) => {
      const { ids } = adminPostExportByIdsSchema.parse(req.body);
      const oids = uniqueObjectIdsFromStrings(ids);
      if (!oids.length) throw new HttpError(400, "No valid post ids");
      await sendPostsCsv(res, "posts-selected.csv", { _id: { $in: oids } }, oids.length);
    })
  );

  router.get(
    "/posts",
    ...admin,
    asyncHandler(async (req, res) => {
      const query = adminPostListQuerySchema.parse(req.query);
      const skip = (query.page - 1) * query.limit;
      const match = await buildPostListMatch(query.q, query.status, query.categorySlug, query.tagSlug);
      const sortDir = query.sortOrder === "desc" ? -1 : 1;
      const sortObj: Record<string, 1 | -1> = { [query.sortField]: sortDir };
      if (query.sortField !== "title") sortObj.title = 1;

      const [items, total] = await Promise.all([
        Post.find(match)
          .sort(sortObj)
          .skip(skip)
          .limit(query.limit)
          .select("title slug excerpt status author publishedAt updatedAt likeCount commentCount category tags createdAt")
          .populate("author", "email name")
          .populate(categoryPopulate)
          .lean(),
        Post.countDocuments(match),
      ]);
      res.json({
        items: items.map((p) => ({
          id: String(p._id),
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          status: p.status,
          publishedAt: p.publishedAt,
          updatedAt: p.updatedAt,
          createdAt: p.createdAt,
          likeCount: p.likeCount,
          commentCount: p.commentCount,
          author:
            p.author && typeof p.author === "object"
              ? {
                  id: String((p.author as unknown as { _id: mongoose.Types.ObjectId })._id),
                  email: (p.author as unknown as { email: string }).email,
                  name: (p.author as unknown as { name: string }).name,
                }
              : null,
          category: formatPostCategory(p.category),
          tags: formatPostTags(p.tags),
        })),
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      });
    })
  );

  router.post(
    "/posts",
    ...admin,
    asyncHandler(async (req: AuthedRequest, res) => {
      const body = adminPostCreateSchema.parse(req.body);
      let authorId = req.user!.id;
      if (body.authorId) {
        if (!mongoose.isValidObjectId(body.authorId)) throw new HttpError(400, "Invalid authorId");
        const u = await User.exists({ _id: body.authorId });
        if (!u) throw new HttpError(400, "Unknown author");
        authorId = body.authorId;
      }
      const leafCategoryId = await requireLeafCategoryId(body.categoryId);
      if (body.status === "published" && !leafCategoryId) {
        throw new HttpError(400, "categoryId is required when publishing");
      }
      const slug = await uniquePostSlug(body.title);
      const publishedAt = body.status === "published" ? new Date() : undefined;
      const tagEmbeds = await resolvePostTagEmbeddings(body.tags);
      const post = await Post.create({
        author: authorId,
        title: body.title,
        slug,
        excerpt: body.excerpt,
        content: body.content,
        tags: tagEmbeds,
        status: body.status,
        coverImageUrl: body.coverImageUrl,
        readTimeMinutes: body.readTimeMinutes,
        publishedAt,
        category: leafCategoryId ?? null,
      });
      res.status(201).json({ id: String(post._id), slug: post.slug });
    })
  );

  router.get(
    "/posts/:id",
    ...admin,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const post = await Post.findById(id)
        .select("title slug excerpt content tags status coverImageUrl readTimeMinutes publishedAt likeCount commentCount author createdAt updatedAt category")
        .populate("author", "email name")
        .populate(categoryPopulate)
        .lean();
      if (!post) throw new HttpError(404, "Not found");
      res.json({
        id: String(post._id),
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        tags: formatPostTags(post.tags),
        status: post.status,
        coverImageUrl: post.coverImageUrl,
        readTimeMinutes: post.readTimeMinutes,
        publishedAt: post.publishedAt,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        author:
          post.author && typeof post.author === "object"
            ? {
                id: String((post.author as unknown as { _id: mongoose.Types.ObjectId })._id),
                email: (post.author as unknown as { email: string }).email,
                name: (post.author as unknown as { name: string }).name,
              }
            : null,
        category: formatPostCategory(post.category),
      });
    })
  );

  router.patch(
    "/posts/:id",
    ...admin,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const body = postUpdateSchema.parse(req.body);
      const post = await Post.findById(id);
      if (!post) throw new HttpError(404, "Not found");
      const oldSlug = post.slug;
      if (body.title !== undefined) post.title = body.title;
      if (body.excerpt !== undefined) post.excerpt = body.excerpt;
      if (body.content !== undefined) post.content = body.content;
      if (body.tags !== undefined) post.set("tags", await resolvePostTagEmbeddings(body.tags));
      if (body.coverImageUrl !== undefined) post.coverImageUrl = body.coverImageUrl;
      if (body.readTimeMinutes !== undefined) post.readTimeMinutes = body.readTimeMinutes;
      if (body.categoryId !== undefined) {
        const nextCat = await requireLeafCategoryId(body.categoryId === "" ? undefined : body.categoryId);
        post.category = nextCat ?? null;
      }
      if (body.status !== undefined) {
        post.status = body.status;
        if (body.status === "published" && !post.publishedAt) post.publishedAt = new Date();
      }
      if (post.status === "published" && !post.category) {
        throw new HttpError(400, "categoryId is required when publishing");
      }
      await post.save();
      delCachePrefix(`post:slug:${oldSlug}`);
      if (post.slug !== oldSlug) delCachePrefix(`post:slug:${post.slug}`);
      res.json({ id: String(post._id), slug: post.slug });
    })
  );

  router.patch(
    "/posts/:id/status",
    ...admin,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const status = req.body?.status as string | undefined;
      if (status !== "draft" && status !== "published") throw new HttpError(400, "Invalid status");
      const post = await Post.findById(id);
      if (!post) throw new HttpError(404, "Not found");
      post.status = status;
      if (status === "published" && !post.publishedAt) post.publishedAt = new Date();
      if (status === "published" && !post.category) {
        throw new HttpError(400, "Post has no category; assign a leaf category before publishing");
      }
      await post.save();
      delCachePrefix(`post:slug:${post.slug}`);
      res.json({ id: String(post._id), slug: post.slug, status: post.status });
    })
  );

  router.delete(
    "/posts/:id",
    ...admin,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const post = await Post.findById(id).lean();
      if (!post) throw new HttpError(404, "Not found");
      await Promise.all([
        Comment.deleteMany({ post: id }),
        Like.deleteMany({ post: id }),
        Bookmark.deleteMany({ post: id }),
        Post.deleteOne({ _id: id }),
      ]);
      delCachePrefix(`post:slug:${post.slug}`);
      res.status(204).end();
    })
  );

  router.post(
    "/",
    ...admin,
    asyncHandler(async (req, res) => {
      const body = adminUserCreateSchema.parse(req.body);
      const email = body.email.toLowerCase().trim();
      const exists = await User.exists({ email });
      if (exists) throw new HttpError(409, "Email already in use");
      const passwordHash = await hashPassword(body.password);
      const user = await User.create({
        email,
        passwordHash,
        name: body.name.trim(),
        role: body.role,
      });
      res.status(201).json({
        id: String(user._id),
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      });
    })
  );

  router.get(
    "/",
    ...admin,
    asyncHandler(async (req, res) => {
      const query = adminUserListQuerySchema.parse(req.query);
      const skip = (query.page - 1) * query.limit;
      const match = buildUserMatch(query.q, query.role);
      const sortDir = query.sortOrder === "desc" ? -1 : 1;
      const sortObj: Record<string, 1 | -1> = { [query.sortField]: sortDir };
      if (query.sortField !== "email") sortObj.email = 1;

      const [items, total] = await Promise.all([
        User.find(match)
          .sort(sortObj)
          .skip(skip)
          .limit(query.limit)
          .select("email name role createdAt")
          .lean(),
        User.countDocuments(match),
      ]);
      res.json({
        items: items.map((u) => ({
          id: String(u._id),
          email: u.email,
          name: u.name,
          role: u.role,
          createdAt: u.createdAt,
        })),
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      });
    })
  );

  router.get(
    "/:id",
    ...admin,
    asyncHandler(async (req: AuthedRequest, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const u = await User.findById(id).select("email name role createdAt updatedAt").lean();
      if (!u) throw new HttpError(404, "Not found");
      res.json({
        id: String(u._id),
        email: u.email,
        name: u.name,
        role: u.role,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
        isSelf: id === req.user!.id,
      });
    })
  );

  router.patch(
    "/:id/role",
    ...admin,
    asyncHandler(async (req: AuthedRequest, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      if (id === req.user!.id) throw new HttpError(400, "Cannot change own role here");
      const body = adminUserRoleSchema.parse(req.body);
      const user = await User.findByIdAndUpdate(id, { role: body.role }, { new: true }).select("email name role").lean();
      if (!user) throw new HttpError(404, "Not found");
      res.json({ id: String(user._id), email: user.email, name: user.name, role: user.role });
    })
  );

  router.delete(
    "/:id",
    ...admin,
    asyncHandler(async (req: AuthedRequest, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      if (id === req.user!.id) throw new HttpError(400, "Cannot delete self");
      const deleted = await User.findById(id);
      if (!deleted) throw new HttpError(404, "Not found");
      const posts = await Post.find({ author: id }).select("_id").lean();
      const postIds = posts.map((p) => p._id);
      if (postIds.length) {
        await Promise.all([
          Comment.deleteMany({ post: { $in: postIds } }),
          Like.deleteMany({ post: { $in: postIds } }),
          Bookmark.deleteMany({ post: { $in: postIds } }),
        ]);
      }
      for (const p of posts) {
        const doc = await Post.findById(p._id).select("slug").lean();
        if (doc?.slug) delCachePrefix(`post:slug:${doc.slug}`);
      }
      await Post.deleteMany({ author: id });
      await User.deleteOne({ _id: id });
      res.status(204).end();
    })
  );

  return router;
}

async function buildPostListMatch(
  q: string | undefined,
  status: string | undefined,
  categorySlug: string | undefined,
  tagSlug: string | undefined
): Promise<Record<string, unknown>> {
  const filter: Record<string, unknown> = {};
  if (status === "draft" || status === "published") filter.status = status;
  const catId = await resolveCategoryFilter({
    category: undefined,
    categorySlug: typeof categorySlug === "string" ? categorySlug : undefined,
  });
  if (catId) filter.category = catId;
  const tagId = await resolveTagSlugFilter(typeof tagSlug === "string" ? tagSlug : undefined);
  if (tagId) filter["tags.tagId"] = tagId;
  const trimmed = q?.trim();
  if (trimmed) {
    const re = new RegExp(trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: re }, { slug: re }, { excerpt: re }];
  }
  return filter;
}
