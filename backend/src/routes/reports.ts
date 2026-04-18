import { Router, type Response } from "express";
import mongoose from "mongoose";
import type { Env } from "../config/env.js";
import { Report } from "../models/Report.js";
import { Post } from "../models/Post.js";
import { Comment } from "../models/Comment.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { authMiddleware, requireAdmin, type AuthedRequest } from "../middleware/auth.js";
import {
  adminReportExportByIdsSchema,
  adminReportListQuerySchema,
  reportCreateSchema,
} from "../validators/schemas.js";
import { z } from "zod";

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

async function buildReportMatch(
  status?: "pending" | "resolved" | "dismissed",
  q?: string
): Promise<Record<string, unknown>> {
  const clauses: Record<string, unknown>[] = [];
  if (status) clauses.push({ status });
  const trimmed = q?.trim();
  if (trimmed) {
    const esc = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(esc, "i");
    const or: Record<string, unknown>[] = [{ reason: rx }, { targetType: rx }];
    if (mongoose.isValidObjectId(trimmed)) {
      or.push({ targetId: new mongoose.Types.ObjectId(trimmed) });
    } else {
      or.push({
        $expr: {
          $regexMatch: { input: { $toString: "$targetId" }, regex: esc, options: "i" },
        },
      });
    }
    const reporters = await User.find({ $or: [{ email: rx }, { name: rx }] })
      .select("_id")
      .lean();
    const rids = reporters.map((u) => u._id);
    if (rids.length) or.push({ reporter: { $in: rids } });
    clauses.push({ $or: or });
  }
  if (clauses.length === 0) return {};
  if (clauses.length === 1) return clauses[0] as Record<string, unknown>;
  return { $and: clauses };
}

async function sendReportsCsv(res: Response, filename: string, match: Record<string, unknown>, rowLimit: number): Promise<void> {
  const rows = await Report.find(match)
    .sort({ createdAt: -1, _id: -1 })
    .limit(rowLimit)
    .populate("reporter", "name email")
    .lean();
  const lines = [
    "id,status,targetType,targetId,reason,reporterEmail,reporterName,createdAt,updatedAt",
    ...rows.map((r) => {
      const rep = r.reporter && typeof r.reporter === "object" ? (r.reporter as { email?: string; name?: string }) : null;
      return [
        csvEscape(String(r._id)),
        csvEscape(r.status),
        csvEscape(r.targetType),
        csvEscape(String(r.targetId)),
        csvEscape(r.reason),
        csvEscape(rep?.email ?? ""),
        csvEscape(rep?.name ?? ""),
        csvEscape(r.createdAt ? new Date(r.createdAt).toISOString() : ""),
        csvEscape(r.updatedAt ? new Date(r.updatedAt).toISOString() : ""),
      ].join(",");
    }),
  ].join("\n");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.send(lines + "\n");
}

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
    "/admin/export",
    ...admin,
    asyncHandler(async (req, res) => {
      const raw = adminReportListQuerySchema.partial().parse(req.query);
      const match = await buildReportMatch(raw.status, raw.q);
      await sendReportsCsv(res, "reports.csv", match, 5000);
    })
  );

  router.post(
    "/admin/export",
    ...admin,
    asyncHandler(async (req, res) => {
      const { ids } = adminReportExportByIdsSchema.parse(req.body);
      const oids = uniqueObjectIdsFromStrings(ids);
      if (!oids.length) throw new HttpError(400, "No valid report ids");
      await sendReportsCsv(res, "reports-selected.csv", { _id: { $in: oids } }, oids.length);
    })
  );

  router.get(
    "/admin",
    ...admin,
    asyncHandler(async (req, res) => {
      const query = adminReportListQuerySchema.parse(req.query);
      const skip = (query.page - 1) * query.limit;
      const filter = await buildReportMatch(query.status, query.q);
      const sortDir = query.sortOrder === "desc" ? -1 : 1;
      const sortObj: Record<string, 1 | -1> = { [query.sortField]: sortDir, _id: sortDir };

      const [items, total] = await Promise.all([
        Report.find(filter)
          .sort(sortObj)
          .skip(skip)
          .limit(query.limit)
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
          updatedAt: r.updatedAt,
          reporter:
            r.reporter && typeof r.reporter === "object"
              ? {
                  id: String((r.reporter as unknown as { _id: mongoose.Types.ObjectId })._id),
                  name: (r.reporter as unknown as { name: string }).name,
                  email: (r.reporter as unknown as { email: string }).email,
                }
              : null,
        })),
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      });
    })
  );

  router.get(
    "/admin/:id",
    ...admin,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const r = await Report.findById(id).populate("reporter", "name email").lean();
      if (!r) throw new HttpError(404, "Not found");
      res.json({
        id: String(r._id),
        targetType: r.targetType,
        targetId: String(r.targetId),
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        reporter:
          r.reporter && typeof r.reporter === "object"
            ? {
                id: String((r.reporter as unknown as { _id: mongoose.Types.ObjectId })._id),
                name: (r.reporter as unknown as { name: string }).name,
                email: (r.reporter as unknown as { email: string }).email,
              }
            : null,
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

  router.delete(
    "/admin/:id",
    ...admin,
    asyncHandler(async (req, res) => {
      const id = req.params.id;
      if (!mongoose.isValidObjectId(id)) throw new HttpError(400, "Invalid id");
      const deleted = await Report.findByIdAndDelete(id).lean();
      if (!deleted) throw new HttpError(404, "Not found");
      res.status(204).send();
    })
  );

  return router;
}
