import { Router } from "express";
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
import { paginationSchema, adminUserRoleSchema } from "../validators/schemas.js";
import { formatPostCategory, resolveCategoryFilter } from "../utils/category.js";

const categoryPopulate = {
  path: "category" as const,
  select: "name slug parent",
  populate: { path: "parent", select: "name slug" },
};

export function createAdminUsersRouter(env: Env) {
  const router = Router();
  const admin = [authMiddleware(env), requireAdmin];

  router.get(
    "/",
    ...admin,
    asyncHandler(async (req, res) => {
      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      const filter = q ? { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") } : {};
      const [items, total] = await Promise.all([
        User.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .select("email name role createdAt")
          .lean(),
        User.countDocuments(filter),
      ]);
      res.json({
        items: items.map((u) => ({
          id: String(u._id),
          email: u.email,
          name: u.name,
          role: u.role,
          createdAt: u.createdAt,
        })),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
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
      await Post.deleteMany({ author: id });
      await User.deleteOne({ _id: id });
      res.status(204).end();
    })
  );

  router.get(
    "/posts",
    ...admin,
    asyncHandler(async (req, res) => {
      const { page, limit } = paginationSchema.parse(req.query);
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const skip = (page - 1) * limit;
      const filter: Record<string, unknown> = {};
      if (status === "draft" || status === "published") filter.status = status;
      const catId = await resolveCategoryFilter({
        category: typeof req.query.category === "string" ? req.query.category : undefined,
        categorySlug: typeof req.query.categorySlug === "string" ? req.query.categorySlug : undefined,
      });
      if (catId) filter.category = catId;

      const [items, total] = await Promise.all([
        Post.find(filter)
          .sort({ updatedAt: -1 })
          .skip(skip)
          .limit(limit)
          .select("title slug excerpt status author publishedAt updatedAt likeCount commentCount category")
          .populate("author", "email name")
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
          status: p.status,
          publishedAt: p.publishedAt,
          updatedAt: p.updatedAt,
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
        })),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
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
      res.status(204).end();
    })
  );

  return router;
}
