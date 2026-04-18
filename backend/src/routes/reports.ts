import { Router } from "express";
import mongoose from "mongoose";
import type { Env } from "../config/env.js";
import { Report } from "../models/Report.js";
import { Post } from "../models/Post.js";
import { Comment } from "../models/Comment.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { authMiddleware, requireAdmin, type AuthedRequest } from "../middleware/auth.js";
import { paginationSchema, reportCreateSchema } from "../validators/schemas.js";
import { z } from "zod";

export function createReportsRouter(env: Env) {
  const router = Router();
  const requireUser = authMiddleware(env);
  const admin = [requireUser, requireAdmin];

  router.post(
    "/",
    requireUser,
    asyncHandler(async (req: AuthedRequest, res) => {
      const body = reportCreateSchema.parse(req.body);
      const targetId = body.targetId;
      if (!mongoose.isValidObjectId(targetId)) throw new HttpError(400, "Invalid target");
      if (body.targetType === "post") {
        const ok = await Post.exists({ _id: targetId });
        if (!ok) throw new HttpError(404, "Target not found");
      } else {
        const ok = await Comment.exists({ _id: targetId });
        if (!ok) throw new HttpError(404, "Target not found");
      }
      await Report.create({
        reporter: req.user!.id,
        targetType: body.targetType,
        targetId,
        reason: body.reason,
      });
      res.status(201).json({ ok: true });
    })
  );

  router.get(
    "/admin",
    ...admin,
    asyncHandler(async (req, res) => {
      const { page, limit } = paginationSchema.parse(req.query);
      const skip = (page - 1) * limit;
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const filter = status ? { status } : {};
      const [items, total] = await Promise.all([
        Report.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate("reporter", "name email")
          .lean(),
        Report.countDocuments(filter),
      ]);
      res.json({
        items: items.map((r) => ({
          id: String(r._id),
          targetType: r.targetType,
          targetId: String(r.targetId),
          reason: r.reason,
          status: r.status,
          createdAt: r.createdAt,
          reporter:
            r.reporter && typeof r.reporter === "object"
              ? {
                  id: String((r.reporter as unknown as { _id: mongoose.Types.ObjectId })._id),
                  name: (r.reporter as unknown as { name: string }).name,
                  email: (r.reporter as unknown as { email: string }).email,
                }
              : null,
        })),
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      });
    })
  );

  const patchSchema = z.object({
    status: z.enum(["pending", "resolved", "dismissed"]),
  });

  router.patch(
    "/admin/:id",
    ...admin,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const body = patchSchema.parse(req.body);
      const report = await Report.findByIdAndUpdate(id, { status: body.status }, { new: true }).lean();
      if (!report) throw new HttpError(404, "Not found");
      res.json({ id: String(report._id), status: report.status });
    })
  );

  return router;
}
