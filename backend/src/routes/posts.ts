import { Router } from "express";
import mongoose from "mongoose";
import type { Env } from "../config/env.js";
import { Post } from "../models/Post.js";
import { Comment } from "../models/Comment.js";
import { Like } from "../models/Like.js";
import { Bookmark } from "../models/Bookmark.js";
import { slugify } from "../utils/slug.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import type { RequestHandler } from "express";
import { paginationSchema, postCreateSchema, postUpdateSchema } from "../validators/schemas.js";
import { delCachePrefix, getCache, setCache } from "../lib/ttlCache.js";
import { formatPostCategory, requireLeafCategoryId, resolveCategoryFilter } from "../utils/category.js";
import { formatPostTags, resolvePostTagEmbeddings, resolveTagSlugFilter } from "../utils/tag.js";

const authorSelect = "name";

const categoryPopulate = {
  path: "category" as const,
  select: "name slug parent",
  populate: { path: "parent", select: "name slug" },
};

async function uniqueSlug(base: string): Promise<string> {
  let slug = base;
  for (let i = 0; i < 8; i++) {
    const exists = await Post.exists({ slug });
    if (!exists) return slug;
    slug = `${base}-${Math.random().toString(36).slice(2, 6)}`;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export function createPostsRouter(env: Env) {
  const router = Router();
  const requireUser = authMiddleware(env);
  const maybeUser = authMiddleware(env, true);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const { page, limit } = paginationSchema.parse(req.query);
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const filter: Record<string, unknown> = { status: "published" };
      if (q) {
        filter.$text = { $search: q };
      }
      const catId = await resolveCategoryFilter({
        category: typeof req.query.category === "string" ? req.query.category : undefined,
        categorySlug: typeof req.query.categorySlug === "string" ? req.query.categorySlug : undefined,
      });
      if (catId) filter.category = catId;
      const tagId = await resolveTagSlugFilter(
        typeof req.query.tagSlug === "string" ? req.query.tagSlug : undefined
      );
      if (tagId) filter["tags.tagId"] = tagId;

      const skip = (page - 1) * limit;
      const baseSelect =
        "title slug excerpt tags coverImageUrl readTimeMinutes publishedAt likeCount commentCount author createdAt category";
      let listQuery = Post.find(filter)
        .skip(skip)
        .limit(limit)
        .populate("author", authorSelect)
        .populate(categoryPopulate);
      if (q) {
        listQuery = listQuery
          .select({
            title: 1,
            slug: 1,
            excerpt: 1,
            tags: 1,
            coverImageUrl: 1,
            readTimeMinutes: 1,
            publishedAt: 1,
            likeCount: 1,
            commentCount: 1,
            author: 1,
            createdAt: 1,
            category: 1,
            score: { $meta: "textScore" },
          })
          .sort({ score: { $meta: "textScore" } });
      } else {
        listQuery = listQuery.select(baseSelect).sort({ publishedAt: -1 });
      }
      const [items, total] = await Promise.all([listQuery.lean(), Post.countDocuments(filter)]);
      res.json({
        items: items.map((p) => ({
          id: String(p._id),
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          tags: formatPostTags(p.tags),
          coverImageUrl: p.coverImageUrl,
          readTimeMinutes: p.readTimeMinutes,
          publishedAt: p.publishedAt,
          likeCount: p.likeCount,
          commentCount: p.commentCount,
          author: p.author && typeof p.author === "object" ? { name: (p.author as unknown as { name: string }).name } : null,
          category: formatPostCategory(p.category),
        })),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    })
  );

  router.get(
    "/mine",
    requireUser,
    asyncHandler(async (req: AuthedRequest, res) => {
      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;
      const filter = { author: req.user!.id };
      const [items, total] = await Promise.all([
        Post.find(filter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .select("title slug excerpt tags status coverImageUrl readTimeMinutes publishedAt likeCount commentCount updatedAt category")
          .populate(categoryPopulate)
          .lean(),
        Post.countDocuments(filter),
      ]);
      res.json({
        items: items.map((p) => ({
          id: String(p._id),
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          tags: formatPostTags(p.tags),
          status: p.status,
          coverImageUrl: p.coverImageUrl,
          readTimeMinutes: p.readTimeMinutes,
          publishedAt: p.publishedAt,
          likeCount: p.likeCount,
          commentCount: p.commentCount,
          updatedAt: p.updatedAt,
          category: formatPostCategory(p.category),
        })),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    })
  );

  router.get(
    "/slug/:slug",
    asyncHandler(async (req, res) => {
      const slug = req.params.slug;
      const cacheKey = `post:slug:${slug}`;
      const cached = getCache<unknown>(cacheKey);
      if (cached) {
        res.json(cached);
        return;
      }
      const post = await Post.findOne({ slug, status: "published" })
        .select("title slug excerpt content tags coverImageUrl readTimeMinutes publishedAt likeCount commentCount author createdAt updatedAt category")
        .populate("author", authorSelect)
        .populate(categoryPopulate)
        .lean();
      if (!post) throw new HttpError(404, "Not found");
      const payload = {
        id: String(post._id),
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        tags: formatPostTags(post.tags),
        coverImageUrl: post.coverImageUrl,
        readTimeMinutes: post.readTimeMinutes,
        publishedAt: post.publishedAt,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        author:
          post.author && typeof post.author === "object"
            ? { name: (post.author as unknown as { name: string }).name }
            : null,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        category: formatPostCategory(post.category),
      };
      setCache(cacheKey, payload);
      res.json(payload);
    })
  );

  const getPostById: RequestHandler = asyncHandler(async (req: AuthedRequest, res) => {
    const id = req.params.id;
    if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
    const post = await Post.findById(id)
      .select("title slug excerpt content tags status coverImageUrl readTimeMinutes publishedAt likeCount commentCount author createdAt updatedAt category")
      .populate("author", authorSelect)
      .populate(categoryPopulate)
      .lean();
    if (!post) throw new HttpError(404, "Not found");
    const authorId = typeof post.author === "object" && post.author && "_id" in post.author ? String((post.author as { _id: mongoose.Types.ObjectId })._id) : String(post.author);
    if (post.status !== "published") {
      if (!req.user || req.user.id !== authorId) throw new HttpError(404, "Not found");
    }
    res.json({
      id: String(post._id),
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      tags: formatPostTags(post.tags),
      coverImageUrl: post.coverImageUrl,
      readTimeMinutes: post.readTimeMinutes,
      publishedAt: post.publishedAt,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      status: post.status,
      author:
        post.author && typeof post.author === "object"
          ? { name: (post.author as unknown as { name: string }).name }
          : null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      category: formatPostCategory(post.category),
    });
  });

  router.get("/:id", maybeUser, getPostById);

  router.post(
    "/",
    requireUser,
    asyncHandler(async (req: AuthedRequest, res) => {
      const body = postCreateSchema.parse(req.body);
      const leafCategoryId = await requireLeafCategoryId(body.categoryId);
      if (body.status === "published" && !leafCategoryId) {
        throw new HttpError(400, "categoryId is required when publishing");
      }
      const base = slugify(body.title);
      const slug = await uniqueSlug(base);
      const publishedAt = body.status === "published" ? new Date() : undefined;
      const tagEmbeds = await resolvePostTagEmbeddings(body.tags);
      const post = await Post.create({
        author: req.user!.id,
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

  router.patch(
    "/:id",
    requireUser,
    asyncHandler(async (req: AuthedRequest, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const body = postUpdateSchema.parse(req.body);
      const post = await Post.findOne({ _id: id, author: req.user!.id });
      if (!post) throw new HttpError(404, "Not found");
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
      delCachePrefix(`post:slug:${post.slug}`);
      res.json({ id: String(post._id), slug: post.slug });
    })
  );

  router.delete(
    "/:id",
    requireUser,
    asyncHandler(async (req: AuthedRequest, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const post = await Post.findOne({ _id: id, author: req.user!.id }).lean();
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

  return router;
}
