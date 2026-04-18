import { Router } from "express";
import mongoose from "mongoose";
import type { Env } from "../config/env.js";
import { Comment, MAX_COMMENT_DEPTH } from "../models/Comment.js";
import { Post } from "../models/Post.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import { paginationSchema, commentCreateSchema } from "../validators/schemas.js";
import { delCachePrefix } from "../lib/ttlCache.js";

export function createCommentsRouter(env: Env) {
  const router = Router({ mergeParams: true });
  const requireUser = authMiddleware(env);

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const postId = req.params.postId;
      if (!mongoose.isValidObjectId(postId)) throw new HttpError(400, "Invalid post");
      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;
      const exists = await Post.exists({ _id: postId, status: "published" });
      if (!exists) throw new HttpError(404, "Not found");
      const [items, total] = await Promise.all([
        Comment.find({ post: postId })
          .sort({ createdAt: 1 })
          .skip(skip)
          .limit(limit)
          .select("body depth parent author createdAt")
          .populate("author", "name")
          .lean(),
        Comment.countDocuments({ post: postId }),
      ]);
      res.json({
        items: items.map((c) => ({
          id: String(c._id),
          body: c.body,
          depth: c.depth,
          parentId: c.parent ? String(c.parent) : null,
          author:
            c.author && typeof c.author === "object"
              ? {
                  id: String((c.author as unknown as { _id: mongoose.Types.ObjectId })._id),
                  name: (c.author as unknown as { name: string }).name,
                }
              : null,
          createdAt: c.createdAt,
        })),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    })
  );

  router.post(
    "/",
    requireUser,
    asyncHandler(async (req: AuthedRequest, res) => {
      const postId = req.params.postId;
      if (!mongoose.isValidObjectId(postId)) throw new HttpError(400, "Invalid post");
      const body = commentCreateSchema.parse(req.body);
      const post = await Post.findOne({ _id: postId, status: "published" });
      if (!post) throw new HttpError(404, "Not found");

      let depth = 0;
      let parent: mongoose.Types.ObjectId | null = null;
      if (body.parentId) {
        if (!mongoose.isValidObjectId(body.parentId)) throw new HttpError(400, "Invalid parent");
        const p = await Comment.findOne({ _id: body.parentId, post: postId }).lean();
        if (!p) throw new HttpError(400, "Invalid parent");
        if (p.depth >= MAX_COMMENT_DEPTH) throw new HttpError(400, "Max reply depth reached");
        depth = p.depth + 1;
        parent = p._id;
      }

      const comment = await Comment.create({
        post: postId,
        author: req.user!.id,
        parent,
        depth,
        body: body.body,
      });
      await Post.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });
      const postDoc = await Post.findById(postId).select("slug").lean();
      if (postDoc?.slug) delCachePrefix(`post:slug:${postDoc.slug}`);
      res.status(201).json({ id: String(comment._id) });
    })
  );

  router.delete(
    "/:commentId",
    requireUser,
    asyncHandler(async (req: AuthedRequest, res) => {
      const { postId, commentId } = req.params;
      if (!mongoose.isValidObjectId(postId) || !mongoose.isValidObjectId(commentId)) {
        throw new HttpError(400, "Invalid id");
      }
      const comment = await Comment.findOne({ _id: commentId, post: postId }).lean();
      if (!comment) throw new HttpError(404, "Not found");
      const isOwner = String(comment.author) === req.user!.id;
      if (!isOwner && req.user!.role !== "admin") throw new HttpError(403, "Forbidden");
      await Comment.deleteOne({ _id: commentId });
      await Post.updateOne({ _id: postId }, { $inc: { commentCount: -1 } });
      const postDoc = await Post.findById(postId).select("slug").lean();
      if (postDoc?.slug) delCachePrefix(`post:slug:${postDoc.slug}`);
      res.status(204).end();
    })
  );

  return router;
}
