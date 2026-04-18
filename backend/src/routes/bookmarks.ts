import { Router } from "express";
import mongoose from "mongoose";
import type { Env } from "../config/env.js";
import { Bookmark } from "../models/Bookmark.js";
import { Post } from "../models/Post.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import { paginationSchema } from "../validators/schemas.js";
import { formatPostCategory } from "../utils/category.js";

const categoryPopulate = {
  path: "category" as const,
  select: "name slug parent",
  populate: { path: "parent", select: "name slug" },
};

export function createBookmarksRouter(env: Env) {
  const router = Router();
  const requireUser = authMiddleware(env);

  router.get(
    "/",
    requireUser,
    asyncHandler(async (req: AuthedRequest, res) => {
      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;
      const filter = { user: req.user!.id };
      const [marks, total] = await Promise.all([
        Bookmark.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate({
            path: "post",
            select: "title slug excerpt status publishedAt coverImageUrl readTimeMinutes category",
            match: { status: "published" },
            populate: categoryPopulate,
          })
          .lean(),
        Bookmark.countDocuments(filter),
      ]);
      const items = marks
        .filter((m) => m.post && typeof m.post === "object")
        .map((m) => {
          const p = m.post as unknown as {
            _id: mongoose.Types.ObjectId;
            title: string;
            slug: string;
            excerpt: string;
            publishedAt?: Date;
            coverImageUrl?: string;
            readTimeMinutes?: number;
            category?: unknown;
          };
          return {
            bookmarkedAt: m.createdAt,
            post: {
              id: String(p._id),
              title: p.title,
              slug: p.slug,
              excerpt: p.excerpt,
              publishedAt: p.publishedAt,
              coverImageUrl: p.coverImageUrl,
              readTimeMinutes: p.readTimeMinutes,
              category: formatPostCategory(p.category),
            },
          };
        });
      res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) || 1 });
    })
  );

  router.get(
    "/:postId/status",
    requireUser,
    asyncHandler(async (req: AuthedRequest, res) => {
      const postId = req.params.postId;
      if (!mongoose.isValidObjectId(postId)) throw new HttpError(400, "Invalid post");
      const exists = await Bookmark.exists({ user: req.user!.id, post: postId });
      res.json({ bookmarked: Boolean(exists) });
    })
  );

  router.post(
    "/:postId/toggle",
    requireUser,
    asyncHandler(async (req: AuthedRequest, res) => {
      const postId = req.params.postId;
      if (!mongoose.isValidObjectId(postId)) throw new HttpError(400, "Invalid post");
      const post = await Post.exists({ _id: postId, status: "published" });
      if (!post) throw new HttpError(404, "Not found");
      const existing = await Bookmark.findOneAndDelete({ user: req.user!.id, post: postId });
      if (existing) {
        res.json({ bookmarked: false });
        return;
      }
      await Bookmark.create({ user: req.user!.id, post: postId });
      res.json({ bookmarked: true });
    })
  );

  return router;
}
