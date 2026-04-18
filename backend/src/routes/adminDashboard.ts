import { Router } from "express";
import type { Env } from "../config/env.js";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { Comment } from "../models/Comment.js";
import { Report } from "../models/Report.js";
import { Category } from "../models/Category.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authMiddleware, requireAdmin } from "../middleware/auth.js";

const admin = (env: Env) => [authMiddleware(env), requireAdmin];

export function createAdminDashboardRouter(env: Env) {
  const router = Router();

  router.get(
    "/",
    ...admin(env),
    asyncHandler(async (_req, res) => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        postsTotal,
        postsPublished,
        postsDraft,
        postsPublishedLast7Days,
        usersTotal,
        usersAdmin,
        commentsTotal,
        reportsTotal,
        reportsPending,
        reportsResolved,
        reportsDismissed,
        categoriesRoot,
        categoriesChild,
        likesAgg,
        recentPosts,
        topPendingReports,
      ] = await Promise.all([
        Post.countDocuments(),
        Post.countDocuments({ status: "published" }),
        Post.countDocuments({ status: "draft" }),
        Post.countDocuments({ status: "published", publishedAt: { $gte: sevenDaysAgo } }),
        User.countDocuments(),
        User.countDocuments({ role: "admin" }),
        Comment.countDocuments(),
        Report.countDocuments(),
        Report.countDocuments({ status: "pending" }),
        Report.countDocuments({ status: "resolved" }),
        Report.countDocuments({ status: "dismissed" }),
        Category.countDocuments({ parent: null }),
        Category.countDocuments({ parent: { $ne: null } }),
        Post.aggregate<{ total: number }>([{ $group: { _id: null, total: { $sum: "$likeCount" } } }]),
        Post.find()
          .sort({ updatedAt: -1 })
          .limit(8)
          .select("title slug status updatedAt publishedAt commentCount likeCount author")
          .populate("author", "name email")
          .lean(),
        Report.find({ status: "pending" })
          .sort({ createdAt: -1 })
          .limit(6)
          .select("targetType targetId reason createdAt")
          .populate("reporter", "name email")
          .lean(),
      ]);

      const totalLikes = likesAgg[0]?.total ?? 0;

      res.json({
        generatedAt: new Date().toISOString(),
        posts: {
          total: postsTotal,
          published: postsPublished,
          draft: postsDraft,
          publishedLast7Days: postsPublishedLast7Days,
        },
        users: { total: usersTotal, admins: usersAdmin },
        comments: { total: commentsTotal },
        reports: {
          total: reportsTotal,
          pending: reportsPending,
          resolved: reportsResolved,
          dismissed: reportsDismissed,
        },
        categories: {
          roots: categoriesRoot,
          children: categoriesChild,
          total: categoriesRoot + categoriesChild,
        },
        engagement: { totalLikes },
        recentPosts: recentPosts.map((p) => ({
          id: String(p._id),
          title: p.title,
          slug: p.slug,
          status: p.status,
          updatedAt: p.updatedAt,
          publishedAt: p.publishedAt ?? null,
          likeCount: p.likeCount ?? 0,
          commentCount: p.commentCount ?? 0,
          author:
            p.author && typeof p.author === "object"
              ? {
                  name: String((p.author as { name?: string }).name ?? ""),
                  email: String((p.author as { email?: string }).email ?? ""),
                }
              : null,
        })),
        pendingReports: topPendingReports.map((r) => ({
          id: String(r._id),
          targetType: r.targetType,
          targetId: String(r.targetId),
          reason: r.reason,
          createdAt: r.createdAt,
          reporter:
            r.reporter && typeof r.reporter === "object"
              ? {
                  name: String((r.reporter as { name?: string }).name ?? ""),
                  email: String((r.reporter as { email?: string }).email ?? ""),
                }
              : null,
        })),
      });
    })
  );

  return router;
}
