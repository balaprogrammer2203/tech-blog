import { Router } from "express";
import mongoose from "mongoose";
import type { Env } from "../config/env.js";
import { Like } from "../models/Like.js";
import { Post } from "../models/Post.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import { delCachePrefix } from "../lib/ttlCache.js";

export function createLikesRouter(env: Env) {
  const router = Router({ mergeParams: true });
  const requireUser = authMiddleware(env);

  router.get(
    "/",
    authMiddleware(env, true),
    asyncHandler(async (req: AuthedRequest, res) => {
      const postId = req.params.postId;
      if (!mongoose.isValidObjectId(postId)) throw new HttpError(400, "Invalid post");
      const published = await Post.exists({ _id: postId, status: "published" });
      if (!published) throw new HttpError(404, "Not found");
      if (!req.user) {
        res.json({ liked: false, likeCount: await Post.findById(postId).select("likeCount").lean().then((p) => p?.likeCount ?? 0) });
        return;
      }
      const [liked, post] = await Promise.all([
        Like.exists({ user: req.user.id, post: postId }),
        Post.findById(postId).select("likeCount slug").lean(),
      ]);
      res.json({ liked: Boolean(liked), likeCount: post?.likeCount ?? 0 });
    })
  );

  router.post(
    "/toggle",
    requireUser,
    asyncHandler(async (req: AuthedRequest, res) => {
      const postId = req.params.postId;
      if (!mongoose.isValidObjectId(postId)) throw new HttpError(400, "Invalid post");
      const post = await Post.findOne({ _id: postId, status: "published" }).select("slug likeCount").lean();
      if (!post) throw new HttpError(404, "Not found");
      const existing = await Like.findOneAndDelete({ user: req.user!.id, post: postId });
      if (existing) {
        await Post.updateOne({ _id: postId }, { $inc: { likeCount: -1 } });
        const updated = await Post.findById(postId).select("likeCount").lean();
        delCachePrefix(`post:slug:${post.slug}`);
        res.json({ liked: false, likeCount: updated?.likeCount ?? 0 });
        return;
      }
      try {
        await Like.create({ user: req.user!.id, post: postId });
      } catch {
        throw new HttpError(409, "Already liked");
      }
      await Post.updateOne({ _id: postId }, { $inc: { likeCount: 1 } });
      const updated = await Post.findById(postId).select("likeCount").lean();
      delCachePrefix(`post:slug:${post.slug}`);
      res.json({ liked: true, likeCount: updated?.likeCount ?? 0 });
    })
  );

  return router;
}
